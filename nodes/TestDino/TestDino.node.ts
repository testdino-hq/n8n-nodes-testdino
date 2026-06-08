import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { BASE_URL, resolveProjectId, testDinoApiRequest, unwrap } from './GenericFunctions';

export class TestDino implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TestDino',
		name: 'testDino',
		icon: 'file:testdino.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Query TestDino test runs, test cases, specs, analytics, and reports',
		documentationUrl: 'https://github.com/testdino-hq/n8n-nodes-testdino',
		defaults: { name: 'TestDino' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'testDinoApi', required: true }],
		properties: [
			// ============================ RESOURCE ============================
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Dashboard', value: 'dashboard' },
					{ name: 'Filter', value: 'filter' },
					{ name: 'Manual Test', value: 'manualTest' },
					{ name: 'Report', value: 'report' },
					{ name: 'Spec', value: 'spec' },
					{ name: 'Test Case', value: 'testCase' },
					{ name: 'Test Run', value: 'testRun' },
					{ name: 'Usage', value: 'usage' },
				],
				default: 'testRun',
			},

			// ============================ TEST RUN ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['testRun'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a test run',
						description: 'Get a single test run by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many test runs',
						description: 'List test runs with optional filters',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Run ID',
				name: 'runId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'test_run_…',
				displayOptions: { show: { resource: ['testRun'], operation: ['get'] } },
			},
			{
				displayName: 'Include',
				name: 'include',
				type: 'multiOptions',
				options: [
					{ name: 'Coverage', value: 'coverage' },
					{ name: 'Errors', value: 'errors' },
					{ name: 'Specs', value: 'specs' },
				],
				default: [],
				description: 'Extra data to include in the run details',
				displayOptions: { show: { resource: ['testRun'], operation: ['get'] } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { resource: ['testRun'], operation: ['getAll'] } },
				options: [
					{ displayName: 'Branch', name: 'branch', type: 'string', default: '' },
					{ displayName: 'Committer', name: 'committer', type: 'string', default: '' },
					{
						displayName: 'Environment',
						name: 'environment',
						type: 'string',
						default: '',
						placeholder: 'production',
						description: 'Filter by environment name (comma-separated for multiple)',
					},
					{
						displayName: 'Period',
						name: 'period',
						type: 'string',
						default: '',
						placeholder: '7d',
						description: 'Date range, e.g. 7d, 30d',
					},
					{
						displayName: 'Search',
						name: 'search',
						type: 'string',
						default: '',
						description: 'Free-text search (matches commit message, etc.)',
					},
					{ displayName: 'Status', name: 'status', type: 'string', default: '' },
					{ displayName: 'Tags', name: 'tags', type: 'string', default: '' },
				],
			},

			// ============================ TEST CASE ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['testCase'] } },
				options: [
					{
						name: 'Explore',
						value: 'explore',
						action: 'Explore aggregated test cases',
						description: 'Aggregated metrics across runs',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a test case',
						description: 'Get a single test case by ID',
					},
					{
						name: 'Get History',
						value: 'history',
						action: 'Get test case history',
						description: 'Execution history for a test case by title',
					},
				],
				default: 'explore',
			},
			{
				displayName: 'Case ID',
				name: 'caseId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['testCase'], operation: ['get'] } },
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				default: '',
				description: 'The test case title to look up history for',
				displayOptions: { show: { resource: ['testCase'], operation: ['history'] } },
			},

			// ============================ SPEC ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['spec'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many specs',
						description: 'List spec files with health metrics',
					},
				],
				default: 'getAll',
			},

			// ============================ MANUAL TEST ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['manualTest'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a manual test case',
						description: 'Get a single manual test case by ID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many manual test cases',
						description: 'List manual test cases',
					},
					{
						name: 'Get Suites',
						value: 'getSuites',
						action: 'Get manual test suites',
						description: 'List manual test suites',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Case ID',
				name: 'manualCaseId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['manualTest'], operation: ['get'] } },
			},

			// ============================ DASHBOARD / ANALYTICS / USAGE / FILTER ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['dashboard'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get the project dashboard',
						description: 'Project health overview',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['analytics'] } },
				options: [
					{
						name: 'Get Summary',
						value: 'getSummary',
						action: 'Get analytics summary',
						description: 'Summary metrics and performance trends',
					},
				],
				default: 'getSummary',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['usage'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get usage',
						description: 'Subscription usage and project allocation',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['filter'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get available filters',
						description: 'Discover environments, branches, developers, and tags',
					},
				],
				default: 'get',
			},

			// ============================ REPORT ============================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['report'] } },
				options: [
					{
						name: 'Generate PDF',
						value: 'generatePdf',
						action: 'Generate a PDF report',
						description: 'Generate and download a project report PDF',
					},
				],
				default: 'generatePdf',
			},
			{
				displayName: 'Lookback Days',
				name: 'days',
				type: 'number',
				default: 7,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of days to include in the report (1-30)',
				displayOptions: { show: { resource: ['report'], operation: ['generatePdf'] } },
			},
			{
				displayName: 'Put Output in Field',
				name: 'binaryProperty',
				type: 'string',
				default: 'data',
				required: true,
				description: 'The name of the output binary field to put the PDF in',
				displayOptions: { show: { resource: ['report'], operation: ['generatePdf'] } },
			},

			// ============================ SHARED: pagination ============================
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['testRun', 'spec', 'manualTest', 'testCase'],
						operation: ['getAll', 'explore', 'getSuites'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['testRun', 'spec', 'manualTest', 'testCase'],
						operation: ['getAll', 'explore', 'getSuites'],
						returnAll: [false],
					},
				},
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				// Report → PDF is binary; handle separately.
				if (resource === 'report' && operation === 'generatePdf') {
					const days = this.getNodeParameter('days', i) as number;
					const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
					// Resolve the project from the PAT — the credential only holds the
					// token; project is discovered via /token-info, like every other op.
					const projectId = await resolveProjectId.call(this);

					const pdf = (await this.helpers.httpRequestWithAuthentication.call(this, 'testDinoApi', {
						method: 'GET',
						url: `${BASE_URL}/api/public/v1/${projectId}/reports/pdf`,
						qs: { days },
						encoding: 'arraybuffer',
						returnFullResponse: false,
					})) as Buffer;

					const binaryData = await this.helpers.prepareBinaryData(
						Buffer.from(pdf),
						`testdino-report-${days}d.pdf`,
						'application/pdf',
					);
					returnData.push({
						json: { success: true, days },
						binary: { [binaryProperty]: binaryData },
						pairedItem: { item: i },
					});
					continue;
				}

				const { endpoint, qs } = buildRequest.call(this, resource, operation, i);

				// Paginated list operations honor "Return All" by walking every page;
				// otherwise buildRequest has already applied a single-page `limit`.
				const isListOp =
					(resource === 'testRun' && operation === 'getAll') ||
					(resource === 'testCase' && operation === 'explore') ||
					(resource === 'spec' && operation === 'getAll') ||
					(resource === 'manualTest' && (operation === 'getAll' || operation === 'getSuites'));
				const returnAll = isListOp && (this.getNodeParameter('returnAll', i, false) as boolean);

				const data = returnAll
					? await fetchAllPages.call(this, endpoint, qs)
					: unwrap((await testDinoApiRequest.call(this, 'GET', endpoint, {}, qs)) as IDataObject);

				if (Array.isArray(data)) {
					for (const entry of data) {
						returnData.push({ json: entry as IDataObject, pairedItem: { item: i } });
					}
				} else {
					returnData.push({ json: data as IDataObject, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Wrap failures in NodeApiError so the n8n UI surfaces the real HTTP
				// status code and response body (stripped by NodeOperationError).
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

/**
 * Resolve (endpoint, query string) for a given resource+operation. Kept as a
 * free function so execute() stays a thin loop.
 */
function buildRequest(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): { endpoint: string; qs: IDataObject } {
	const qs: IDataObject = {};

	const applyPagination = () => {
		const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
		if (!returnAll) qs.limit = this.getNodeParameter('limit', i, 50) as number;
	};

	switch (resource) {
		case 'testRun':
			if (operation === 'get') {
				const runId = this.getNodeParameter('runId', i) as string;
				const include = this.getNodeParameter('include', i, []) as string[];
				if (include.length) qs.include = include.join(',');
				return { endpoint: `/test-runs/${runId}`, qs };
			}
			// getAll
			{
				const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
				Object.assign(qs, filters);
				applyPagination();
				return { endpoint: '/test-runs', qs };
			}

		case 'testCase':
			if (operation === 'get') {
				const caseId = this.getNodeParameter('caseId', i) as string;
				return { endpoint: `/test-cases/${caseId}`, qs };
			}
			if (operation === 'history') {
				qs.title = this.getNodeParameter('title', i) as string;
				return { endpoint: '/test-cases/history', qs };
			}
			// explore
			applyPagination();
			return { endpoint: '/test-case-explorer', qs };

		case 'spec':
			applyPagination();
			return { endpoint: '/specs', qs };

		case 'manualTest':
			if (operation === 'get') {
				const manualCaseId = this.getNodeParameter('manualCaseId', i) as string;
				return { endpoint: `/manual-tests/${manualCaseId}`, qs };
			}
			if (operation === 'getSuites') {
				applyPagination();
				return { endpoint: '/manual-tests/suites', qs };
			}
			applyPagination();
			return { endpoint: '/manual-tests', qs };

		case 'dashboard':
			return { endpoint: '/dashboard', qs };

		case 'analytics':
			return { endpoint: '/analytics/summary', qs };

		case 'usage':
			return { endpoint: '/usage', qs };

		case 'filter':
			return { endpoint: '/filters', qs };

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Unsupported resource/operation: ${resource}/${operation}`,
			);
	}
}

/**
 * Walk every page of a paginated list endpoint and return the concatenated
 * results. Used when "Return All" is on. Reads the response envelope's
 * `pagination.hasMore` to decide when to stop, with a hard guard against a
 * runaway loop if the server ever reports hasMore incorrectly.
 */
async function fetchAllPages(
	this: IExecuteFunctions,
	endpoint: string,
	baseQs: IDataObject,
): Promise<IDataObject[]> {
	const PAGE_SIZE = 100; // server clamps limit to 100
	const all: IDataObject[] = [];
	let page = 1;

	for (let guard = 0; guard < 10000; guard++) {
		const response = (await testDinoApiRequest.call(
			this,
			'GET',
			endpoint,
			{},
			{
				...baseQs,
				page,
				limit: PAGE_SIZE,
			},
		)) as IDataObject;

		const data = unwrap(response);
		const pageItems = Array.isArray(data)
			? (data as IDataObject[])
			: data
				? [data as IDataObject]
				: [];
		all.push(...pageItems);

		// Stop on any reliable end-of-list signal. We can't rely on `hasMore`
		// alone — some endpoints (e.g. test-runs) omit it and only return
		// `total`. A short page (fewer items than the server's effective limit)
		// is the most robust signal that we've reached the last page.
		const pagination = response?.pagination as IDataObject | undefined;
		const total = typeof pagination?.total === 'number' ? (pagination.total as number) : undefined;
		const effLimit =
			typeof pagination?.limit === 'number' ? (pagination.limit as number) : PAGE_SIZE;
		const noMore =
			pagination?.hasMore === false ||
			pageItems.length === 0 ||
			pageItems.length < effLimit ||
			(total !== undefined && all.length >= total);
		if (noMore) break;
		page++;
	}

	return all;
}
