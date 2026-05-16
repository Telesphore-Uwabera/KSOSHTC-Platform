import { useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { clearStoredUser, getStoredUser } from "@/lib/auth";
import { clearAdminSessionPolicy, setAdminSessionToken, adminFetch } from "@/lib/adminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "@/lib/apiBase";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    setAdminSessionToken(null);
    clearAdminSessionPolicy();
    clearStoredUser();
    navigate("/admin/login", { replace: true });
  };

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const res = await fetch(getApiBase() + "/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      return data.settings;
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await adminFetch(getApiBase() + "/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRegistrationActive: isActive }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["public", "settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const isRegistrationActive = settingsData?.isRegistrationActive ?? false;

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

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              Registration Form
              {isRegistrationActive ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-600"></span> Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-gray-600"></span> Deactive
                </span>
              )}
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              When active, the registration link will appear in the navigation bar.
            </p>
          </div>
          <Switch
            checked={isRegistrationActive}
            onCheckedChange={(checked) => settingsMutation.mutate(checked)}
            disabled={isLoading || settingsMutation.isPending}
          />
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

