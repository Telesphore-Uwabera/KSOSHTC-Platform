import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareQuote, Save, Loader2 } from "lucide-react";
import type { Testimonial, TestimonialCreate } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

async function addTestimonial(data: TestimonialCreate): Promise<unknown> {
  const res = await adminFetch(getApiBase() + "/api/testimonials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to add testimonial");
  }
  return res.json();
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await adminFetch(getApiBase() + "/api/testimonials");
  if (!res.ok) throw new Error("Failed to load testimonials");
  return res.json();
}

export default function AdminTestimonials() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });

  const mutation = useMutation({
    mutationFn: addTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setName("");
      setRole("");
      setQuote("");
      setAvatarUrl("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, role: role || "Participant", quote, avatarUrl: avatarUrl || undefined });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <MessageSquareQuote className="w-6 h-6" />
          Testimonials management
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6">
          Add testimonials that appear on the home page. Current count:{" "}
          <span className="font-semibold text-gray-900">{testimonialsLoading ? "…" : testimonials.length}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Jean Claude"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role / Title
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Safety Officer, Participant"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="quote" className="block text-sm font-medium text-gray-700 mb-1">
              Quote <span className="text-red-500">*</span>
            </label>
            <textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
              rows={4}
              placeholder="What did they say about the training?"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>
          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Avatar image URL (optional)
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {mutation.isError && <p className="text-red-600 text-sm">{mutation.error?.message}</p>}
          {mutation.isSuccess && <p className="text-green-600 text-sm">Testimonial added successfully.</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Add testimonial
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
