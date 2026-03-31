const STORAGE_KEY = "ksohtc_admin_session";

export function setAdminSessionToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getAdminSessionToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Attach Bearer token for protected admin API routes (when ADMIN_SESSION_SECRET is set on the server). */
export function withAdminAuth(init?: RequestInit): RequestInit {
  const token = getAdminSessionToken();
  const headers = new Headers(init?.headers ?? undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

export function adminFetch(input: string | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, withAdminAuth(init));
}
