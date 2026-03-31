import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { clearStoredUser, getStoredUser, setStoredUser } from "../lib/auth";
import { getApiBase } from "../lib/apiBase";
import type { UserPublic } from "@shared/api";

export default function DashboardSettings() {
  const navigate = useNavigate();
  const [, setBump] = useState(0);
  const user = getStoredUser();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleLogout = () => {
    clearStoredUser();
    navigate("/login", { replace: true });
  };

  const refreshFromServer = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch(`${getApiBase()}/api/users/${encodeURIComponent(user.id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Could not refresh your profile.");
      }
      const updated = (data as { user?: UserPublic }).user;
      if (!updated || typeof updated !== "object") {
        throw new Error("Invalid response from server.");
      }
      setStoredUser(updated);
      setBump((n) => n + 1);
    } catch (e) {
      setRefreshError(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Settings</h1>
      <p className="text-gray-600 text-sm sm:text-base mb-6">
        Manage your learner session for Kigali Safety OSH Training Center.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">Account</p>
            <p className="text-xs sm:text-sm text-gray-600">
              Signed in as <span className="font-semibold">{user?.email ?? "Unknown user"}</span>.
              Your access to courses depends on admin approval and your registered sector.
            </p>
            {user?.approved === false && (
              <p className="text-xs sm:text-sm text-amber-800 mt-2">
                Your account is pending approval. After an admin approves you, use &quot;Refresh account from server&quot; so this device picks up the change without signing in again.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={refreshFromServer}
            disabled={!user?.id || refreshing}
            className="inline-flex items-center justify-center gap-2 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/15 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh account from server
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out of learner account
          </button>
        </div>
        {refreshError ? <p className="text-sm text-red-600">{refreshError}</p> : null}
      </div>
    </div>
  );
}
