import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { testDinoApiRequest } from '../TestDino/GenericFunctions';

// Map the node's event options to the backend's webhook event constants.
const EVENT_MAP: Record<string, string> = {
	runStarted: 'RUN_STARTED',
	runFinished: 'RUN_FINISHED',
};

export class TestDinoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TestDino Trigger',
		name: 'testDinoTrigger',
		icon: 'file:testdino.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when a TestDino test run event occurs',
		documentationUrl: 'https://github.com/testdino-hq/n8n-nodes-testdino',
		defaults: { name: 'TestDino Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'testDinoApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'runFinished',
				options: [
					{
						name: 'Run Finished',
						value: 'runFinished',
						description: 'A test run completed (with an optional outcome filter)',
					},
					{
						name: 'Run Started',
						value: 'runStarted',
						description: 'A new test run was created',
					},
				],
			},
			{
				displayName: 'Trigger On',
				name: 'outcome',
				type: 'options',
				default: 'any',
				description: 'Which finished runs should fire this trigger',
				displayOptions: { show: { event: ['runFinished'] } },
				options: [
					{ name: 'Any Outcome', value: 'any', description: 'Every finished run' },
					{ name: 'Failures Only', value: 'failed', description: 'Only runs with failures' },
					{ name: 'Passing Only', value: 'passed', description: 'Only runs with no failures' },
				],
			},
		],
		usableAsTool: true,
	};

	// The webhook lifecycle: n8n calls these when the workflow is
	// activated/deactivated. We self-register the webhook URL with TestDino so
	// the platform knows where to deliver events, and clean it up on removal.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId) {
					try {
						await testDinoApiRequest.call(this, 'GET', `/webhooks/${webhookData.webhookId}`);
						return true;
					} catch {
						// Stored id is gone on the server side — fall through to URL reconcile.
						delete webhookData.webhookId;
					}
				}

				// No id, or a stale id: reconcile by URL. If an *active* registration
				// for this exact URL already exists (e.g. n8n restarted and lost its
				// static data), adopt it instead of creating a duplicate. Disabled
				// rows (e.g. auto-disabled after delivery failures) are intentionally
				// ignored so create() can register a fresh, delivering webhook.
				const matches = await findWebhooksByUrl.call(this);
				const activeMatch = matches.find((w) => w.active === true);
				const activeId = activeMatch && webhookIdOf(activeMatch);
				if (activeId) {
					webhookData.webhookId = activeId;
					return true;
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;

				// Remove any stale registrations for this exact URL (e.g. auto-disabled
				// orphans from a previous run) so we never accumulate duplicates.
				for (const stale of await findWebhooksByUrl.call(this)) {
					const staleId = webhookIdOf(stale);
					if (staleId) await deleteWebhookQuietly.call(this, staleId);
				}

				const body: IDataObject = {
					url: webhookUrl,
					events: [EVENT_MAP[event]],
					source: 'n8n',
					description: `n8n workflow: ${this.getWorkflow().name || 'unnamed'}`,
				};
				if (event === 'runFinished') {
					body.conditions = { outcome: this.getNodeParameter('outcome', 'any') as string };
				}

				const response = (await testDinoApiRequest.call(
					this,
					'POST',
					'/webhooks',
					body,
				)) as IDataObject;

				const created = (response.data as IDataObject) || {};
				const webhookId = created.id || created._id;
				if (!webhookId) return false;

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = webhookId;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				// Fall back to a URL lookup if we lost the id — otherwise a missing id
				// would leave the registration behind as an orphan that keeps 404ing.
				const webhookId =
					(webhookData.webhookId as string | undefined) ??
					webhookIdOf((await findWebhooksByUrl.call(this))[0] ?? {});

				if (webhookId) {
					try {
						await testDinoApiRequest.call(this, 'DELETE', `/webhooks/${webhookId}`);
					} catch {
						// Already deleted on the server — nothing to do.
					}
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		return { workflowData: [this.helpers.returnJsonArray(body as IDataObject)] };
	}
}

/**
 * Return every webhook registration matching this node's exact webhook URL.
 * Used to reconcile/clean up when the workflow's stored webhookId is missing —
 * preventing duplicate or orphaned subscriptions.
 */
async function findWebhooksByUrl(this: IHookFunctions): Promise<IDataObject[]> {
	const webhookUrl = this.getNodeWebhookUrl('default');
	if (!webhookUrl) return [];
	try {
		const response = (await testDinoApiRequest.call(
			this,
			'GET',
			'/webhooks',
			{},
			{
				url: webhookUrl,
			},
		)) as IDataObject;
		const list = (response?.data as IDataObject[]) || [];
		return list.filter((w) => w.url === webhookUrl);
	} catch {
		return [];
	}
}

function webhookIdOf(w: IDataObject): string | undefined {
	const id = w.id ?? w._id;
	return id ? String(id) : undefined;
}

/** Best-effort delete; a missing registration is already in the desired state. */
async function deleteWebhookQuietly(this: IHookFunctions, id: string): Promise<void> {
	try {
		await testDinoApiRequest.call(this, 'DELETE', `/webhooks/${id}`);
	} catch {
		// Already deleted on the server — nothing to do.
	}
}
