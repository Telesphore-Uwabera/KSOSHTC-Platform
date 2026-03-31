import { useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { clearStoredUser, getStoredUser } from "@/lib/auth";
import { setAdminSessionToken } from "@/lib/adminApi";

export default function AdminSettings() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    setAdminSessionToken(null);
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Admin settings</h1>
      <p className="text-gray-600 text-sm sm:text-base mb-6">
        Manage your administrator session for Kigali Safety OSH Training Center.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">Admin account</p>
            <p className="text-xs sm:text-sm text-gray-600">
              Signed in as <span className="font-semibold">{user?.email ?? "Unknown admin"}</span>.
              Use this page to securely end your admin session when you are finished.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out of admin account
          </button>
        </div>
      </div>
    </div>
  );
}

