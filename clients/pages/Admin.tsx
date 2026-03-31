import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Users, CheckCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import type { TestimonialCreate, UserPublic } from "@shared/api";
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

async function fetchUsers(): Promise<UserPublic[]> {
  const res = await adminFetch(getApiBase() + "/api/users");
  if (!res.ok) throw new Error("Failed to load users");
  const data = await res.json();
  return (data as { users: UserPublic[] }).users ?? [];
}

async function approveUser(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to approve user");
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />
      <div className="h-28 sm:h-32" aria-hidden="true" />

      <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-secondary font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          {/* Pending registrations */}
          <div className="bg-white rounded-[30px] shadow-lg border border-gray-200 p-6 sm:p-8 mb-8">
            <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registrations
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Approve users so they can access courses. Only approved users can enroll.
            </p>
            {usersLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-sm">No registered users yet.</p>
            ) : (
              <ul className="space-y-3">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-600">{u.email}{u.organization ? ` · ${u.organization}` : ""}</p>
                      <p className="text-xs text-gray-500">
                        {u.approved ? (
                          <span className="text-green-600">Approved</span>
                        ) : (
                          <span className="text-amber-600">Pending approval</span>
                        )}
                      </p>
                    </div>
                    {!u.approved && (
                      <button
                        type="button"
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isPending}
                        className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-[30px] shadow-lg border border-gray-200 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Add Testimonial</h1>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              New testimonials will appear in the &ldquo;What Our Participants Say&rdquo; section on the home page.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {mutation.isError && (
                <p className="text-red-600 text-sm">{mutation.error?.message}</p>
              )}
              {mutation.isSuccess && (
                <p className="text-green-600 text-sm">Testimonial added successfully.</p>
              )}

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
      </section>

      <Footer />
    </div>
  );
}
