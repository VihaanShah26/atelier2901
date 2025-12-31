type PostResult<T = unknown> = {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
};

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env.API_BASE_URL as string | undefined) ||
  '';

const DEFAULT_TIMEOUT_MS = 12000;

const buildUrl = (path: string) => {
  if (!API_BASE_URL) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
};

export async function postJSON<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PostResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await safeJson(res);

    if (res.ok) {
      return { ok: true, status: res.status, data };
    }

    const message =
      typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : undefined;
    return { ok: false, status: res.status, data, message };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, status: 0, message: 'timeout' };
    }
    return { ok: false, status: 0, message: 'network' };
  } finally {
    clearTimeout(timeoutId);
  }
}
