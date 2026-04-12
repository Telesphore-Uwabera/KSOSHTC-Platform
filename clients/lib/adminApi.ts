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

export async function adminFetch(input: string | Request, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, withAdminAuth(init));
  
  if (res.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    // Only intercept if we are deep in the admin panel
    if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
      try {
        const data = await res.clone().json();
        const msg = (data?.error ?? "").toLowerCase();
        
        if (msg.includes("admin session") || msg.includes("unauthorized") || msg.includes("token")) {
          setAdminSessionToken(null);
          try {
            sessionStorage.setItem(POLICY_KEY, "yes");
          } catch { /* ignore */ }
          
          console.warn("Admin session expired. Redirecting...");
          window.location.replace("/admin/login?reason=session");
          
          // Return a dummy promise that never resolves/rejects to prevent the caller from continuing
          return new Promise(() => {});
        }
      } catch (e) {
        // Fallback for non-JSON 401s
        window.location.replace("/admin/login?reason=session");
        return new Promise(() => {});
      }
    }
  }
  
  return res;
}
