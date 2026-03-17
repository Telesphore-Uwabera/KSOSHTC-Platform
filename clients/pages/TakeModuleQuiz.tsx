import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getStoredUser } from "../lib/auth";
import { getApiBase } from "@/lib/apiBase";
import type { AssessmentDoc, CourseDoc } from "@shared/api";

const getCourseContentApi = () => getApiBase() + "/api/course-content";

async function fetchCourse(courseId: string): Promise<CourseDoc | null> {
  const res = await fetch(`${getCourseContentApi()}/courses/${courseId}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchAssessment(
  courseId: string,
  moduleId: string,
  assessmentId: string
): Promise<AssessmentDoc | null> {
  const res = await fetch(
    `${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments/${assessmentId}`
  );
  if (!res.ok) return null;
  return res.json();
}

export default function TakeModuleQuiz() {
  const { courseId, moduleId, assessmentId } = useParams<{
    courseId: string;
    moduleId: string;
    assessmentId: string;
  }>();
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const canAccess = user?.approved ?? false;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["course-content", "course", courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["course-content", "assessment", courseId, moduleId, assessmentId],
    queryFn: () => fetchAssessment(courseId!, moduleId!, assessmentId!),
    enabled: !!courseId && !!moduleId && !!assessmentId && canAccess,
  });

  const setAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!assessment || !user?.id || submitted || submitting) return;
    setSubmitting(true);
    try {
      const answersArray = assessment.questions.map((q) => answers[q.id] ?? -1);
      const res = await fetch(
        `${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments/${assessmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, answers: answersArray }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Submit failed");
      }
      const data = (await res.json()) as { submission?: { percentage: number }; passed: boolean };
      setScore(data.submission?.percentage ?? 0);
      setPassed(data.passed ?? false);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    } catch {
      setScore(0);
      setPassed(false);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!courseId || !moduleId || !assessmentId) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-gray-600">Invalid link.</p>
          <Link to="/courses" className="text-primary font-medium mt-2 inline-block">
            Back to courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!canAccess) {
    const pendingApproval = user && !user.approved;
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          {pendingApproval ? (
            <>
              <h2 className="text-lg font-bold text-primary mb-2">Registration under review</h2>
              <p className="text-gray-600">
                Thank you for registering with KSOSHTC. Your account is currently under review by our administration team. You will be able to take quizzes once your registration has been approved. If you have already been approved, please log out and log in again to refresh your access.
              </p>
            </>
          ) : (
            <p className="text-gray-600">You need to be logged in and approved to take this quiz.</p>
          )}
          <Link to="/courses" className="text-primary font-medium mt-4 inline-block">
            Back to courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading || !assessment) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          {isLoading ? (
            <p className="text-gray-600">Loading quiz…</p>
          ) : (
            <p className="text-gray-600">Quiz not found.</p>
          )}
          <Link
            to={`/courses/${courseId}`}
            className="text-primary font-medium mt-2 inline-block"
          >
            Back to course
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const passedResult = passed !== null ? passed : (score !== null && score >= assessment.passThreshold);
  const courseTitle = course?.title ?? "Course";

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {courseTitle}
          </Link>

          <h1 className="text-2xl font-bold text-primary mb-2">{assessment.title}</h1>
          {assessment.description && (
            <p className="text-gray-600 text-sm mb-6">{assessment.description}</p>
          )}

          <div className="space-y-6">
            {assessment.questions.map((q, idx) => {
              const selectedIdx = answers[q.id];
              const isCorrect = selectedIdx === q.correctIndex;
              
              return (
                <div 
                  key={q.id} 
                  className={`bg-white rounded-2xl border transition-all ${
                    submitted 
                      ? isCorrect 
                        ? "border-green-200 bg-green-50/10" 
                        : "border-red-200 bg-red-50/10"
                      : "border-gray-200"
                  } p-4 sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <p className="font-bold text-gray-900 leading-tight">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs mr-2">
                        {idx + 1}
                      </span>
                      {q.text}
                    </p>
                    {submitted && (
                      isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                      )
                    )}
                  </div>

                  <ul className="space-y-3">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedIdx === oIdx;
                      const isActuallyCorrect = oIdx === q.correctIndex;
                      
                      let optionClass = "border-gray-100 bg-white hover:bg-gray-50";
                      if (submitted) {
                        if (isActuallyCorrect) optionClass = "border-green-500 bg-green-50 text-green-800 font-semibold";
                        else if (isSelected && !isActuallyCorrect) optionClass = "border-red-300 bg-red-50 text-red-800";
                        else optionClass = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                      } else if (isSelected) {
                        optionClass = "border-primary bg-primary/5 text-primary font-medium";
                      }

                      return (
                        <li key={oIdx}>
                          <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${!submitted ? "cursor-pointer" : "cursor-default"} ${optionClass}`}>
                            {!submitted && (
                              <input
                                type="radio"
                                name={q.id}
                                checked={isSelected}
                                onChange={() => setAnswer(q.id, oIdx)}
                                className="w-4 h-4 text-primary"
                              />
                            )}
                            <span className="flex-1">{opt}</span>
                            {submitted && isActuallyCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {submitted && isSelected && !isActuallyCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {!submitted ? (
            <div className="mt-10 p-6 bg-primary/5 rounded-[24px] border border-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-primary mb-1">Ready to submit?</h3>
                  <p className="text-sm text-gray-600">
                    You've answered {Object.keys(answers).length} of {assessment.questions.length} questions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < assessment.questions.length || submitting}
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit assessment"}
                </button>
              </div>
            </div>
          ) : (
            <div className={`mt-10 p-8 rounded-[32px] border-2 ${passedResult ? "border-green-200 bg-green-50/20" : "border-red-200 bg-red-50/20"} text-center`}>
              <div className="flex flex-col items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${passedResult ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {passedResult ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                </div>
                <div>
                  <h2 className={`text-3xl font-black ${passedResult ? "text-green-800" : "text-red-800"}`}>
                    {passedResult ? "Congratulations!" : "Keep Trying!"}
                  </h2>
                  <p className={`text-xl font-bold mt-1 ${passedResult ? "text-green-700" : "text-red-700"}`}>
                    {passedResult ? "You passed the assessment." : "You didn't reach the pass threshold."}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-6 px-6 py-3 bg-white/60 rounded-2xl border border-white/50 shadow-sm">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Your Score</p>
                      <p className={`text-2xl font-black ${passedResult ? "text-green-600" : "text-red-600"}`}>{score}%</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Required</p>
                      <p className="text-2xl font-black text-gray-700">{assessment.passThreshold}%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/courses/${courseId}`}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                      passedResult 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {passedResult ? "Continue course" : "Study materials and retry"}
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
