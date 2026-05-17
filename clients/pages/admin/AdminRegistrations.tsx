import { useQuery } from "@tanstack/react-query";
import { UserPlus, Loader2, Download } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";
import type { RegistrationSubmissionDoc } from "@shared/api";

export default function AdminRegistrations() {
  const { data: registrations = [], isLoading } = useQuery<RegistrationSubmissionDoc[]>({
    queryKey: ["registrations"],
    queryFn: async () => {
      const res = await adminFetch(getApiBase() + "/api/registrations");
      if (!res.ok) throw new Error("Failed to load registrations");
      const data = await res.json();
      return data.registrations || [];
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2 mb-2">
          <UserPlus className="w-6 h-6" />
          Training Registrations
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6">
          View all learners who have submitted the training registration form.
        </p>

        {isLoading ? (
          <p className="text-gray-500 text-sm mt-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading registrations...
          </p>
        ) : registrations.length === 0 ? (
          <p className="text-gray-500 text-sm mt-6">No registrations found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Names</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Courses</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(reg.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {reg.names}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{reg.email}</div>
                      <div>{reg.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ul className="list-disc pl-4">
                        {reg.courses.map((c: string) => <li key={c}>{c}</li>)}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 space-y-1">
                      {reg.registrationFeeReceiptUrl && (
                        <div>
                          <a href={reg.registrationFeeReceiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <Download className="w-3 h-3" /> Reg. Fee
                          </a>
                        </div>
                      )}
                      {reg.tuitionFeeReceiptUrl && (
                        <div>
                          <a href={reg.tuitionFeeReceiptUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <Download className="w-3 h-3" /> Tuition Fee
                          </a>
                        </div>
                      )}
                      {reg.highestDegreeUrls?.map((url: string, i: number) => (
                        <div key={i}>
                          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <Download className="w-3 h-3" /> Degree {i + 1}
                          </a>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
