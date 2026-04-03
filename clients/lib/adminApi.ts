const STORAGE_KEY = "ksohtc_admin_session";
/** "yes" = server issues Bearer tokens; "no" = ADMIN_SESSION_SECRET unset (admin APIs work without token). Set from /api/login response. */
const POLICY_KEY = "ksohtc_admin_session_required";

export function setAdminSessionPolicyFromLogin(data: {
  adminSessionToken?: string;
  adminSessionWarning?: string;
}, role: string | undefined): void {
  try {
    if (role !== "admin") {
      sessionStorage.removeItem(POLICY_KEY);
      return;
    }
    if (data.adminSessionWarning) {
      sessionStorage.setItem(POLICY_KEY, "no");
      return;
    }
    if (data.adminSessionToken) {
      sessionStorage.setItem(POLICY_KEY, "yes");
      return;
    }
    sessionStorage.setItem(POLICY_KEY, "yes");
  } catch {
    /* ignore */
  }
}

export function clearAdminSessionPolicy(): void {
  try {
    sessionStorage.removeItem(POLICY_KEY);
  } catch {
    /* ignore */
  }
}

/** When true, admin UI should require a Bearer token (default if unknown). */
export function serverExpectsAdminBearer(): boolean {
  try {
    return sessionStorage.getItem(POLICY_KEY) !== "no";
  } catch {
    return true;
  }
}

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
  return fetch(input, withAdminAuth(init)).then((res) => {
    if (res.status !== 401 || typeof window === "undefined") return res;
    const path = window.location.pathname;
    if (!path.startsWith("/admin") || path.startsWith("/admin/login")) return res;
    res
      .clone()
      .json()
      .then((data: { error?: string }) => {
        const msg = (data?.error ?? "").toLowerCase();
        if (msg.includes("admin session")) {
          setAdminSessionToken(null);
          try {
            sessionStorage.setItem(POLICY_KEY, "yes");
          } catch {
            /* ignore */
          }
          window.location.replace("/admin/login?reason=session");
        }
      })
      .catch(() => {});
    return res;
  });
}
