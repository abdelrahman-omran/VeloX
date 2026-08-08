import {
  ActivePrsResponseSchema,
  ErrorEnvelopeSchema,
  SprintHealthSchema,
  type ActivePrsResponse,
  type ScoredPr,
  type SprintHealth,
} from '../schemas';
import { fixturePrs, fixtureSprintHealth } from '../fixtures/demo';

const fixturesEnabled = () => import.meta.env.VITE_USE_FIXTURES !== 'false';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError('Invalid JSON from server.', 'invalid_json', response.status);
  }
}

async function fetchAndParse<T>(
  path: string,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const response = await fetch(path, {
    headers: { Accept: 'application/json' },
  });

  const body = await parseJson(response);

  if (!response.ok) {
    const envelope = ErrorEnvelopeSchema.safeParse(body);
    if (envelope.success) {
      throw new ApiError(
        envelope.data.error.message,
        envelope.data.error.code,
        response.status,
      );
    }
    throw new ApiError(`Request failed (${response.status}).`, 'http_error', response.status);
  }

  try {
    return schema.parse(body);
  } catch {
    throw new ApiError('Response failed schema validation.', 'validation_failed', 200);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getActivePrs(): Promise<ScoredPr[]> {
  if (fixturesEnabled()) {
    await delay(400);
    return fixturePrs;
  }

  const data: ActivePrsResponse = await fetchAndParse(
    '/api/prs/active',
    ActivePrsResponseSchema,
  );
  return data.items;
}

export async function getSprintHealth(): Promise<SprintHealth> {
  if (fixturesEnabled()) {
    await delay(350);
    return fixtureSprintHealth;
  }

  return fetchAndParse('/api/sprint/health', SprintHealthSchema);
}
