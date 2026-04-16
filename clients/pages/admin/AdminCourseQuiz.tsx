import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Trash2, Plus, ArrowLeft } from "lucide-react";
import type { Quiz, QuizQuestion, CourseId } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

async function fetchQuiz(courseId: string): Promise<Quiz | null> {
  const res = await adminFetch(getApiBase() + `/api/courses/${courseId}/quiz`);
  if (!res.ok) return null;
  return res.json();
}

async function saveQuiz(courseId: string, payload: Partial<Quiz> & { questions: QuizQuestion[] }): Promise<Quiz> {
  const res = await adminFetch(getApiBase() + `/api/courses/${courseId}/quiz`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to save quiz");
  }
  return res.json();
}

async function deleteQuiz(courseId: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/courses/${courseId}/quiz`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete quiz");
}

const emptyQuestion = (): QuizQuestion => ({
  id: crypto.randomUUID(),
  text: "",
  options: ["", ""],
  correctIndex: 0,
});

export default function AdminCourseQuiz() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const staffBase = location.pathname.startsWith("/instructor") ? "/instructor" : "/admin";
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("Course assessment");
  const [description, setDescription] = useState("");
  const [passThreshold, setPassThreshold] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", courseId],
    queryFn: () => fetchQuiz(courseId!),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description ?? "");
      setPassThreshold(quiz.passThreshold);
      setQuestions(quiz.questions.length ? quiz.questions.map((q) => ({ ...q })) : [emptyQuestion()]);
    } else if (!isLoading && courseId) {
      setQuestions([emptyQuestion()]);
    }
  }, [quiz, isLoading, courseId]);

  const saveMutation = useMutation({
    mutationFn: () => saveQuiz(courseId!, { title, description: description || undefined, passThreshold, questions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", courseId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-exists", courseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuiz(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", courseId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-exists", courseId] });
      navigate(`${staffBase}/courses`);
    },
  });

  const addQuestion = () => setQuestions((q) => [...q, emptyQuestion()]);
  const removeQuestion = (index: number) => setQuestions((q) => q.filter((_, i) => i !== index));
  const setQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((q) => q.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const setOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((q) => {
      const next = q.map((item, i) => {
        if (i !== qIndex) return item;
        const opts = [...item.options];
        opts[oIndex] = value;
        return { ...item, options: opts };
      });
      return next;
    });
  };
  const addOption = (qIndex: number) => {
    setQuestions((q) =>
      q.map((item, i) => (i === qIndex ? { ...item, options: [...item.options, ""] } : item))
    );
  };
  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((q) =>
      q.map((item, i) => {
        if (i !== qIndex) return item;
        const opts = item.options.filter((_, j) => j !== oIndex);
        const correctIndex = Math.min(item.correctIndex, Math.max(0, opts.length - 1));
        return { ...item, options: opts, correctIndex };
      })
    );
  };

  if (!courseId) return null;

  const validCourseIds: CourseId[] = ["construction", "industrial-safety", "mining", "safety-management", "safety-for-all"];
  const courseLabel = validCourseIds.includes(courseId as CourseId)
    ? courseId.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : courseId;

  return (
    <div className="space-y-6">
      <Link
        to={`${staffBase}/courses`}
        className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="bg-white rounded-[30px] shadow-lg border border-gray-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-primary mb-6">Quiz & assessment — {courseLabel}</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
              placeholder="e.g. Course assessment"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary resize-y"
              placeholder="Instructions for participants"
            />
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pass threshold (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={passThreshold}
              onChange={(e) => setPassThreshold(Number(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Questions</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" /> Add question
            </button>
          </div>
          <ul className="space-y-6">
            {questions.map((q, qIdx) => (
              <li key={q.id} className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50/50">
                <div className="flex justify-between gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-500">Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => setQuestion(qIdx, { text: e.target.value })}
                  placeholder="Question text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 mb-3 focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mb-2">Options (select the correct one)</p>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === oIdx}
                      onChange={() => setQuestion(qIdx, { correctIndex: oIdx })}
                      className="rounded-full"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => setOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      className="flex-1 px-3 py-1.5 rounded border border-gray-200 focus:outline-none focus:border-primary text-sm"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="text-sm text-primary font-medium hover:underline mt-1"
                >
                  + Add option
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || questions.some((q) => !q.text.trim() || q.options.every((o) => !o.trim()))}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save quiz
          </button>
          {quiz && (
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 border-2 border-red-200 text-red-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete quiz
            </button>
          )}
        </div>
        {saveMutation.isError && <p className="text-red-600 text-sm mt-2">{saveMutation.error?.message}</p>}
      </div>
    </div>
  );
}
