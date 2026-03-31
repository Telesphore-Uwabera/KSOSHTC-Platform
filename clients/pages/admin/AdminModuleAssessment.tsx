import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Trash2, Plus, ArrowLeft, CheckCircle } from "lucide-react";
import type { AssessmentDoc, QuizQuestion, LessonDoc } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

const getCourseContentApi = () => getApiBase() + "/api/course-content";

async function fetchAssessment(courseId: string, moduleId: string, assessmentId: string): Promise<AssessmentDoc | null> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments`);
  if (!res.ok) return null;
  const data = await res.json();
  const list = (data as { assessments: AssessmentDoc[] }).assessments ?? [];
  return list.find((a) => a.id === assessmentId) ?? null;
}

async function fetchLessons(courseId: string, moduleId: string): Promise<LessonDoc[]> {
  const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/lessons`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as { lessons: LessonDoc[] }).lessons ?? [];
}

function emptyQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    text: "",
    options: ["", ""],
    correctIndex: 0,
  };
}

export default function AdminModuleAssessment() {
  const { courseId, moduleId, assessmentId } = useParams<{ courseId: string; moduleId: string; assessmentId: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("Assessment");
  const [description, setDescription] = useState("");
  const [passThreshold, setPassThreshold] = useState(70);
  const [order, setOrder] = useState(0);
  const [afterLessonId, setAfterLessonId] = useState<string>("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-content", "lessons", courseId, moduleId],
    queryFn: () => fetchLessons(courseId!, moduleId!),
    enabled: !!(courseId && moduleId),
  });

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["course-content", "assessments", courseId, moduleId],
    queryFn: () => fetchAssessment(courseId!, moduleId!, assessmentId!),
    enabled: !!(courseId && moduleId && assessmentId),
  });

  useEffect(() => {
    if (assessment) {
      setTitle(assessment.title);
      setDescription(assessment.description ?? "");
      setPassThreshold(assessment.passThreshold);
      setOrder(assessment.order ?? 0);
      setAfterLessonId(assessment.afterLessonId ?? "");
      setQuestions(
        assessment.questions?.length
          ? assessment.questions.map((q) => ({ ...q, id: q.id || crypto.randomUUID() }))
          : [emptyQuestion()]
      );
    } else if (!isLoading && assessmentId) {
      setQuestions([emptyQuestion()]);
    }
  }, [assessment, isLoading, assessmentId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await adminFetch(`${getCourseContentApi()}/courses/${courseId}/modules/${moduleId}/assessments/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          passThreshold,
          questions,
          order,
          afterLessonId: afterLessonId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-content", "assessments", courseId, moduleId] });
    },
  });

  const addQuestion = () => setQuestions((q) => [...q, emptyQuestion()]);
  const removeQuestion = (index: number) => setQuestions((q) => q.filter((_, i) => i !== index));
  const setQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((q) => q.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const setOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((q) =>
      q.map((item, i) => {
        if (i !== qIndex) return item;
        const opts = [...item.options];
        opts[oIndex] = value;
        return { ...item, options: opts };
      })
    );
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

  if (!courseId || !moduleId || !assessmentId) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Missing course or module or assessment.</p>
        <Link to="/admin/course-content" className="mt-2 inline-block text-primary font-medium">Back to course content</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Assessment not found.</p>
        <Link to={`/admin/course-content/${courseId}`} className="mt-2 inline-block text-primary font-medium">Back to course</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={`/admin/course-content/${courseId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to course
      </Link>

      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Edit assessment</h1>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pass threshold (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={passThreshold}
              onChange={(e) => setPassThreshold(Number(e.target.value))}
              className="w-24 px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Break placement – show quiz after which lesson?</label>
            <p className="text-xs text-gray-500 mb-1">Learners must pass this quiz before opening the next lesson.</p>
            <select
              value={afterLessonId}
              onChange={(e) => setAfterLessonId(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-200 bg-white"
            >
              <option value="">End of module (no break)</option>
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  After: {l.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order (number for sorting)</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-24 px-4 py-2 rounded-lg border border-gray-200"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Questions</h2>
              <p className="text-sm text-gray-500">Add multiple choice questions for this assessment.</p>
            </div>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add question
            </button>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400">No questions added yet. Click "Add question" to start.</p>
            </div>
          )}

          {questions.map((q, qIndex) => (
            <div
              key={q.id}
              className="group relative p-6 rounded-[24px] border border-gray-200 bg-white hover:border-primary/30 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Multiple Choice</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                  title="Remove question"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-tight ml-1">Question Prompt</label>
                <textarea
                  value={q.text}
                  onChange={(e) => setQuestion(qIndex, { text: e.target.value })}
                  placeholder="e.g., What is the primary goal of site safety?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-tight">Options & Correct Answer</label>
                  <span className="text-[10px] text-gray-400 italic">Select the circular button for the correct answer</span>
                </div>
                <div className="grid gap-2">
                  {q.options.map((opt, oIndex) => (
                    <div
                      key={oIndex}
                      className={`flex items-center gap-3 p-1 rounded-xl border transition-all ${
                        q.correctIndex === oIndex
                          ? "border-primary/40 bg-primary/5 shadow-sm"
                          : "border-gray-100 bg-transparent hover:border-gray-200"
                      }`}
                    >
                      <label className="relative flex items-center justify-center w-10 h-10 cursor-pointer shrink-0">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctIndex === oIndex}
                          onChange={() => setQuestion(qIndex, { correctIndex: oIndex })}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                      </label>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => setOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-300"
                      />
                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="flex items-center gap-1.5 text-sm text-primary font-bold hover:text-secondary transition-colors ml-1"
                >
                  <Plus className="w-4 h-4" /> Add another option
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {questions.some(q => !q.text.trim() || q.options.some(o => !o.trim())) && (
            <p className="text-sm text-red-500 font-medium">Please fill in all question and option text before saving.</p>
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending || 
                questions.length === 0 || 
                questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))
              }
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold border-b-4 border-primary/20 active:translate-y-1 active:border-b-0 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save assessment
            </button>
            {saveMutation.isSuccess && (
              <p className="text-green-600 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                <CheckCircle className="w-5 h-5" /> Changes saved successfully
              </p>
            )}
            {saveMutation.isError && (
              <p className="text-red-600 font-bold">Error: {(saveMutation.error as Error).message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
