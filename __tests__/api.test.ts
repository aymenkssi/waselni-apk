import { ApiError, buildUrl, createApi, errorMessage, TokenStore } from '../lib/api';

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) }) as unknown as Response;

function store(access: string | null = 'A1', refresh: string | null = 'R1') {
  const s = { access, refresh, expired: 0 };
  const tokens: TokenStore = {
    getAccess: () => s.access, getRefresh: () => s.refresh, setAccess: (t) => { s.access = t; }, onExpired: () => { s.expired += 1; },
  };
  return { s, tokens };
}

describe('buildUrl', () => {
  it('skips empty query values and encodes the others', () => {
    expect(buildUrl('https://x/api', '/offers', { origin_country: 'Côte d’Ivoire', mode: '', page: 2, x: undefined }))
      .toBe('https://x/api/offers?origin_country=C%C3%B4te%20d%E2%80%99Ivoire&page=2');
  });
});

describe('errorMessage', () => {
  it('reads {message} from the error handler, then {detail} from FastAPI', () => {
    expect(errorMessage({ success: false, message: 'Email déjà utilisé' }, 'x')).toBe('Email déjà utilisé');
    expect(errorMessage({ detail: 'Non autorisé' }, 'x')).toBe('Non autorisé');
    expect(errorMessage({ detail: [{ msg: 'field required' }] }, 'x')).toBe('field required');
    expect(errorMessage('oops', 'fallback')).toBe('fallback');
  });
});

describe('createApi', () => {
  it('sends the bearer token and JSON body', async () => {
    const { tokens } = store();
    const fetchMock = jest.fn().mockResolvedValue(json(200, { id: '1' }));
    const api = createApi('https://x/api', tokens, fetchMock);
    await expect(api.post('/offers', { a: 1 })).resolves.toEqual({ id: '1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://x/api/offers');
    expect(init.headers.Authorization).toBe('Bearer A1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"a":1}');
  });

  it('refreshes an expired access token once, then retries', async () => {
    const { s, tokens } = store();
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(json(401, { message: 'Token expiré' }))
      .mockResolvedValueOnce(json(200, { access_token: 'A2' }))
      .mockResolvedValueOnce(json(200, { ok: true }));
    const api = createApi('https://x/api', tokens, fetchMock);
    await expect(api.get('/users/me')).resolves.toEqual({ ok: true });
    expect(fetchMock.mock.calls[1][0]).toBe('https://x/api/auth/refresh');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer R1');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer A2');
    expect(s.access).toBe('A2');
  });

  it('shares one refresh between concurrent calls', async () => {
    const { tokens } = store();
    const fetchMock = jest.fn((url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(json(200, { access_token: 'A2' }));
      const auth = (init.headers as Record<string, string>).Authorization;
      return Promise.resolve(auth === 'Bearer A2' ? json(200, { ok: true }) : json(401, {}));
    });
    const api = createApi('https://x/api', tokens, fetchMock as unknown as typeof fetch);
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
    expect(fetchMock.mock.calls.filter(([u]) => u.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('ends the session when the refresh token is rejected', async () => {
    const { s, tokens } = store();
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(json(401, { message: 'Token expiré' }))
      .mockResolvedValueOnce(json(401, { message: 'Token expiré' }));
    const api = createApi('https://x/api', tokens, fetchMock);
    await expect(api.get('/users/me')).rejects.toMatchObject({ status: 401, message: 'Token expiré' });
    expect(s.expired).toBe(1);
  });

  it('does not refresh for login or 2FA calls', async () => {
    const { tokens } = store();
    const fetchMock = jest.fn().mockResolvedValue(json(401, { message: 'Email ou mot de passe incorrect' }));
    const api = createApi('https://x/api', tokens, fetchMock);
    await expect(api.request('/auth/login', { method: 'POST', body: {}, noRefresh: true })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports network failures with status 0', async () => {
    const { tokens } = store();
    const api = createApi('https://x/api', tokens, jest.fn().mockRejectedValue(new TypeError('Network request failed')));
    await expect(api.get('/offers')).rejects.toMatchObject({ status: 0 });
  });

  it('sends files as multipart form data without a JSON content type', async () => {
    const { tokens } = store();
    const fetchMock = jest.fn().mockResolvedValue(json(200, {}));
    const api = createApi('https://x/api', tokens, fetchMock);
    await api.upload('/users/me/avatar', { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' }, { document_date: '2026-10-01' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://x/api/users/me/avatar?document_date=2026-10-01');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers['Content-Type']).toBeUndefined();
  });
});
