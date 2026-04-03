import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getStoredUser } from "../lib/auth";
import { useDashboardData } from "./dashboardData";
import { buildAdminHandoutStreamUrl, fetchLearnerHandouts } from "@/lib/learnerAdminHandouts";

export default function DashboardHandouts() {
  const user = getStoredUser();
  const { canAccess, courses, isLoading: coursesLoading } = useDashboardData();

  const { data: handouts = [], isLoading: handoutsLoading } = useQuery({
    queryKey: ["admin-distributed-assignments", "learner", user?.id],
    queryFn: () => fetchLearnerHandouts(user!.id),
    enabled: !!user?.id && canAccess,
  });

  if (!user) return null;

  if (!canAccess) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
        <p className="text-gray-600">You can open shared materials after your account is approved.</p>
        <Link to="/dashboard" className="text-primary font-medium mt-4 inline-block">
          Back to overview
        </Link>
      </div>
    );
  }

  const courseLabel = (id: string) => courses.find((c) => c.id === id)?.title ?? id;
  const loading = handoutsLoading || coursesLoading;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="w-7 h-7" />
          Assignment materials from KSOSHTC
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl">
          Assignments and quiz materials your instructors published for your programme. Only files that match your
          allowed courses appear here. You also receive an email when something new is shared with you.
        </p>
        <p className="text-sm text-gray-500 mt-3">
          <Link to="/dashboard/work-submissions" className="font-semibold text-primary hover:underline">
            Submit your own work
          </Link>{" "}
          on the Submit work page when you are ready.
        </p>
      </div>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        {loading ? (
          <p className="text-gray-500 text-sm flex items-center gap-2 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </p>
        ) : handouts.length === 0 ? (
          <p className="text-gray-600 text-sm py-6 text-center">
            No shared materials yet. When your instructors publish materials for your courses, they will show up here.
          </p>
        ) : (
          <ul className="space-y-4">
            {handouts.map((h) => (
              <li
                key={h.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-lg">{h.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {h.courseIds.map(courseLabel).join(" · ")} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                  {h.description ? (
                    <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{h.description}</p>
                  ) : null}
                </div>
                <a
                  href={buildAdminHandoutStreamUrl(h.pdfUrl, h.originalFilename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-95 shrink-0"
                >
                  Open file <ExternalLink className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
