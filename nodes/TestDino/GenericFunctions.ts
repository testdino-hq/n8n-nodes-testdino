import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

type TestDinoContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

/**
 * TestDino API base URL. Switch environments by editing this one line:
 *   Local:      http://localhost:3001
 *   Staging:    https://staging.testdino.com
 *   Production: https://api.testdino.com
 */
export const BASE_URL = 'https://api.testdino.com';

// projectId is derived from the (project-scoped) PAT via /token-info and cached
// per token for the process lifetime — a token's project never changes, so this
// is safe and avoids an extra round-trip on every request.
const projectIdCache = new Map<string, string>();

/**
 * Resolve the project this token is scoped to by calling /token-info (which does
 * NOT require a projectId in the URL). Cached per PAT. This is what lets the
 * credential be a single field (just the token) — the project is discovered, not
 * configured.
 */
export async function resolveProjectId(this: TestDinoContext): Promise<string> {
	const credentials = await this.getCredentials('testDinoApi');
	const apiKey = String(credentials.apiKey || '');

	const cached = projectIdCache.get(apiKey);
	if (cached) return cached;

	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'testDinoApi', {
		method: 'GET',
		url: `${BASE_URL}/api/public/v1/token-info`,
		json: true,
	})) as IDataObject;

	const project = (response?.data as IDataObject)?.project as IDataObject | undefined;
	const projectId = project?.id ? String(project.id) : '';
	if (!projectId) {
		throw new Error('Could not resolve project from token — /token-info returned no project.');
	}

	projectIdCache.set(apiKey, projectId);
	return projectId;
}

/**
 * Make an authenticated request to the TestDino public API.
 *
 * Builds the project-scoped URL (/api/public/v1/{projectId}{endpoint}) — the
 * projectId is resolved from the token, not configured — and injects the Bearer
 * PAT via httpRequestWithAuthentication so the token is never handled directly
 * here (a requirement for verified nodes: no manual credential plumbing).
 */
export async function testDinoApiRequest(
	this: TestDinoContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const projectId = await resolveProjectId.call(this);

	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}/api/public/v1/${projectId}${endpoint}`,
		json: true,
	};
	if (Object.keys(body).length) options.body = body;
	if (Object.keys(qs).length) options.qs = qs;

	return this.helpers.httpRequestWithAuthentication.call(this, 'testDinoApi', options);
}

/**
 * Unwrap the TestDino response envelope ({ success, data, pagination }) into the
 * payload n8n expects. Returns `data` when present, else the raw body.
 */
export function unwrap(response: IDataObject): IDataObject | IDataObject[] {
	if (response && typeof response === 'object' && 'data' in response) {
		return response.data as IDataObject | IDataObject[];
	}
	return response;
}
