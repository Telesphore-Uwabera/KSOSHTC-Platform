import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getStoredUser } from "../lib/auth";
import type { Quiz, CourseDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";

const getCourseContentApi = () => getApiBase() + "/api/course-content";

async function fetchCourse(courseId: string): Promise<CourseDoc | null> {
  const res = await fetch(`${getCourseContentApi()}/courses/${courseId}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchQuiz(courseId: string): Promise<Quiz | null> {
  const res = await fetch(getApiBase() + `/api/courses/${courseId}/quiz`);
  if (!res.ok) return null;
  return res.json();
}

export default function TakeQuiz() {
  const { courseId } = useParams<{ courseId: string }>();
  const user = getStoredUser();
  const canAccess = user?.approved ?? false;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course-content", "course", courseId],
    queryFn: () => fetchCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", courseId],
    queryFn: () => fetchQuiz(courseId!),
    enabled: !!courseId && canAccess,
  });

  const setAnswer = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quiz || submitted) return;
    const correct = quiz.questions.filter((q) => answers[q.id] === q.correctIndex).length;
    const pct = quiz.questions.length ? Math.round((correct / quiz.questions.length) * 100) : 0;
    setScore(pct);
    setSubmitted(true);
  };

  if (!courseId) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-gray-600">Invalid course.</p>
          <Link to="/courses" className="text-primary font-medium mt-2 inline-block">Back to courses</Link>
        </div>
        <Footer />
      </div>
    );
  }
  if (!courseLoading && !course) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-gray-600">Course not found.</p>
          <Link to="/courses" className="text-primary font-medium mt-2 inline-block">Back to courses</Link>
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
          <Link to="/courses" className="text-primary font-medium mt-4 inline-block">Back to courses</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (courseLoading || !course || isLoading || !quiz) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="h-28" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          {courseLoading || isLoading ? (
            <p className="text-gray-600">Loading…</p>
          ) : (
            <p className="text-gray-600">No quiz available for this course.</p>
          )}
          <Link to={`/courses/${courseId}`} className="text-primary font-medium mt-2 inline-block">
            Back to {course?.title ?? "course"}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const passed = score !== null && score >= quiz.passThreshold;

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
            <ArrowLeft className="w-4 h-4" /> Back to {course.title}
          </Link>

          <h1 className="text-2xl font-bold text-primary mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-600 text-sm mb-6">{quiz.description}</p>}

          {!submitted ? (
            <>
              <ul className="space-y-6">
                {quiz.questions.map((q, idx) => (
                  <li key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                    <p className="font-medium text-gray-900 mb-3">
                      {idx + 1}. {q.text}
                    </p>
                    <ul className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx}>
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === oIdx}
                              onChange={() => setAnswer(q.id, oIdx)}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-gray-700">{opt}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < quiz.questions.length}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Submit answers
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  You have selected answers for {Object.keys(answers).length} of {quiz.questions.length} questions.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
              <div className={`flex items-center gap-3 mb-4 ${passed ? "text-green-700" : "text-amber-700"}`}>
                {passed ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                <div>
                  <p className="text-xl font-bold">{passed ? "Passed" : "Not passed"}</p>
                  <p className="text-lg">Score: {score}% (required: {quiz.passThreshold}%)</p>
                </div>
              </div>
              <Link to={`/courses/${courseId}`} className="text-primary font-medium hover:underline">
                Back to course materials
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
