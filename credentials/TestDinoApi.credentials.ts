import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { BASE_URL } from '../nodes/TestDino/GenericFunctions';

/**
 * TestDino public API credential.
 *
 * Auth is a Project Personal Access Token (tdp_…) with the `public-api` scope,
 * sent as a Bearer token. The PAT is itself bound to one project, so the token
 * is the only thing the user configures — the project is discovered from it via
 * /token-info. One token = one project connection.
 */
export class TestDinoApi implements ICredentialType {
	name = 'testDinoApi';

	displayName = 'TestDino API';

	icon = 'file:../nodes/TestDino/testdino.svg' as `file:${string}.svg`;

	documentationUrl = 'https://docs.testdino.com/api-reference/overview';

	properties: INodeProperties[] = [
		{
			displayName: 'Personal Access Token',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			placeholder: 'tdp_…',
			description:
				'A Project Personal Access Token with the public-api scope. Create one in TestDino under Project Settings → API.',
		},
	];

	// Inject the PAT as a Bearer token on every request.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// "Test connection" hits the token-only /token-info endpoint, which verifies
	// the PAT and its scope and resolves the project it is bound to.
	test: ICredentialTestRequest = {
		request: {
			baseURL: BASE_URL,
			url: '/api/public/v1/token-info',
			method: 'GET',
		},
	};
}
