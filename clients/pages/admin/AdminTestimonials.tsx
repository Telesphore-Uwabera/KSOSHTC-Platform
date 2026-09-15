import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquareQuote,
  Save,
  Loader2,
  Trash2,
  Edit,
  Plus,
  Upload,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Quote,
  Search,
  Sparkles,
  Calendar,
  Star,
} from "lucide-react";
import type { Testimonial, TestimonialCreate, TestimonialUpdate } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";
import { SiteImage } from "@/components/SiteImage";

async function fetchTestimonials(): Promise<Testimonial[]> {
  const res = await adminFetch(getApiBase() + "/api/testimonials");
  if (!res.ok) throw new Error("Failed to load testimonials");
  return res.json();
}

async function addTestimonial(data: TestimonialCreate): Promise<Testimonial> {
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

async function updateTestimonial({
  id,
  data,
}: {
  id: string;
  data: TestimonialUpdate;
}): Promise<Testimonial> {
  const res = await adminFetch(getApiBase() + `/api/testimonials/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to update testimonial");
  }
  return res.json();
}

async function deleteTestimonial(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/testimonials/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to delete testimonial");
  }
}

export default function AdminTestimonials() {
  const queryClient = useQueryClient();

  // Create form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<{ filename: string; contentBase64: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const QUOTE_MAX = 500;

  // Filter/search state
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal state
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editQuote, setEditQuote] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<{ filename: string; contentBase64: string } | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deletingItem, setDeletingItem] = useState<Testimonial | null>(null);

  // Feedback notifications
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: fetchTestimonials,
  });

  const createMutation = useMutation({
    mutationFn: addTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setName("");
      setRole("");
      setQuote("");
      setRating(5);
      setHoverRating(0);
      setAvatarUrl("");
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatusMessage({ type: "success", text: "Testimonial created with WebP Cloudinary upload!" });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: Error) => {
      setStatusMessage({ type: "error", text: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setEditingItem(null);
      setStatusMessage({ type: "success", text: "Testimonial updated successfully!" });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: Error) => {
      setStatusMessage({ type: "error", text: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setDeletingItem(null);
      setStatusMessage({ type: "success", text: "Testimonial deleted successfully!" });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: Error) => {
      setStatusMessage({ type: "error", text: err.message });
    },
  });

  // Handle file selection for Create form
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select a valid image file." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image is too large. Maximum size is 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarFile({
        filename: file.name,
        contentBase64: result,
      });
      // Clear manual url input if user selected a file
      setAvatarUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      role: role.trim() || "Participant",
      quote: quote.trim(),
      rating,
      avatarUrl: avatarUrl.trim() || undefined,
      avatarFile: avatarFile || undefined,
    });
  };

  // Open Edit Modal
  const handleStartEdit = (t: Testimonial) => {
    setEditingItem(t);
    setEditName(t.name);
    setEditRole(t.role);
    setEditQuote(t.quote);
    setEditRating((t as Testimonial & { rating?: number }).rating ?? 5);
    setEditHoverRating(0);
    setEditAvatarUrl(t.avatarUrl || "");
    setEditAvatarPreview(t.avatarUrl || null);
    setEditAvatarFile(null);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  // Handle file selection for Edit form
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please select a valid image file." });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Image is too large. Maximum size is 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditAvatarPreview(result);
      setEditAvatarFile({
        filename: file.name,
        contentBase64: result,
      });
      setEditAvatarUrl("");
    };
    reader.readAsDataURL(file);
  };

  const handleClearEditAvatar = () => {
    setEditAvatarFile(null);
    setEditAvatarPreview(null);
    setEditAvatarUrl("");
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim() || !editQuote.trim()) return;

    updateMutation.mutate({
      id: editingItem.id,
      data: {
        name: editName.trim(),
        role: editRole.trim() || "Participant",
        quote: editQuote.trim(),
        rating: editRating,
        avatarUrl: editAvatarFile ? undefined : (editAvatarUrl.trim() || undefined),
        avatarFile: editAvatarFile || undefined,
      },
    });
  };

  // Filtered testimonials
  const filteredTestimonials = testimonials.filter((t) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      t.name.toLowerCase().includes(term) ||
      (t.role && t.role.toLowerCase().includes(term)) ||
      t.quote.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareQuote className="w-7 h-7 text-primary" />
            Testimonials Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Create, edit, and organize participant testimonials that slide continuously on the home page.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm self-start sm:self-auto">
          <span>Current count:</span>
          <span className="font-bold text-gray-900">{testimonialsLoading ? "…" : testimonials.length}</span>
        </div>
      </div>

      {/* Global Status Message */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm transition-all duration-300 ${
            statusMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: Add Testimonial Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Plus className="w-5 h-5 text-primary" />
            <span>Add New Testimonial</span>
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            Step 1 of 1
          </span>
        </div>

        <form onSubmit={handleSubmitCreate} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Participant Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Jean Claude Mugabo"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Role / Title
              </label>
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Safety Inspector, Mining Sector"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="quote" className="block text-sm font-semibold text-gray-700">
                Testimonial Quote <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-medium ${quote.length >= QUOTE_MAX ? "text-red-500" : "text-gray-400"}`}>
                {quote.length}/{QUOTE_MAX}
              </span>
            </div>
            <textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value.slice(0, QUOTE_MAX))}
              required
              rows={4}
              maxLength={QUOTE_MAX}
              placeholder="What did they say about the OSH training, instructors, or practical drills?"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-y"
            />
          </div>

          {/* Star Rating Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Star Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className="w-7 h-7"
                    fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                    stroke={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 font-medium">{rating} / 5</span>
            </div>
          </div>

          {/* Avatar Image Uploader with WebP & Cloudinary Notice */}
          <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Avatar Photo (Image Upload)
                </label>
                <p className="text-xs text-gray-500">
                  Select any photo (JPG, PNG, WebP). It is automatically converted to WebP and saved in Cloudinary.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium self-start sm:self-auto border border-emerald-200/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto WebP & Cloudinary</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Preview Thumbnail */}
              {avatarPreview ? (
                <div className="relative group shrink-0">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-primary shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleClearAvatar}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                    title="Remove avatar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-200 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 shrink-0">
                  <ImageIcon className="w-7 h-7 mb-1 text-gray-400" />
                  <span className="text-[10px] text-gray-500 font-medium">No Image</span>
                </div>
              )}

              {/* Upload Action */}
              <div className="space-y-2 flex-1 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-file-input"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="avatar-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    {avatarPreview ? "Change photo" : "Upload avatar image"}
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleClearAvatar}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Optional direct URL input if needed */}
                <div className="pt-1">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      if (e.target.value) {
                        setAvatarPreview(e.target.value);
                        setAvatarFile(null);
                      }
                    }}
                    placeholder="Or paste an image URL (optional)"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving & Uploading…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Add Testimonial
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Testimonials Cards Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>All Testimonials</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">
                {filteredTestimonials.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage testimonials below. Cards appear in continuous scrolling on the client side.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search testimonials…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {testimonialsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <MessageSquareQuote className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              {searchTerm ? "No matching testimonials" : "No testimonials created yet"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm
                ? "Try searching with different keywords."
                : "Add your first testimonial using the form above. It will display here and on the client website."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 group"
              >
                <div>
                  {/* Card Header: Avatar, Name, Role */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.avatarUrl ? (
                        <SiteImage
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover bg-gray-100 border border-gray-200 shadow-sm shrink-0"
                          sizes="48px"
                          cloudinaryMaxWidth={128}
                          decoding="async"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm border border-primary/20">
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-sm sm:text-base">{t.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{t.role || "Participant"}</p>
                      </div>
                    </div>

                    <div className="text-primary/40 group-hover:text-primary transition-colors shrink-0">
                      <Quote className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Star rating on card */}
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const r = (t as Testimonial & { rating?: number }).rating ?? 5;
                      return (
                        <Star
                          key={star}
                          className="w-4 h-4"
                          fill={r >= star ? "#f59e0b" : "none"}
                          stroke={r >= star ? "#f59e0b" : "#d1d5db"}
                        />
                      );
                    })}
                    <span className="ml-1 text-xs text-gray-400 font-medium">
                      {(t as Testimonial & { rating?: number }).rating ?? 5}/5
                    </span>
                  </div>

                  {/* Card Body: Quote */}
                  <p className="text-gray-700 text-sm leading-relaxed italic line-clamp-4 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(t)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 font-semibold transition-colors"
                      title="Edit testimonial"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(t)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors"
                      title="Delete testimonial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                <span>Edit Testimonial</span>
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">
                    Quote <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-medium ${editQuote.length >= QUOTE_MAX ? "text-red-500" : "text-gray-400"}`}>
                    {editQuote.length}/{QUOTE_MAX}
                  </span>
                </div>
                <textarea
                  value={editQuote}
                  onChange={(e) => setEditQuote(e.target.value.slice(0, QUOTE_MAX))}
                  required
                  rows={4}
                  maxLength={QUOTE_MAX}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                />
              </div>

              {/* Edit Star Rating Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Star Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      onMouseEnter={() => setEditHoverRating(star)}
                      onMouseLeave={() => setEditHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className="w-6 h-6"
                        fill={(editHoverRating || editRating) >= star ? "#f59e0b" : "none"}
                        stroke={(editHoverRating || editRating) >= star ? "#f59e0b" : "#d1d5db"}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500 font-medium">{editRating} / 5</span>
                </div>
              </div>

              {/* Edit Avatar Photo Uploader */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Update Avatar Photo (WebP & Cloudinary)
                </label>
                <div className="flex items-center gap-4">
                  {editAvatarPreview ? (
                    <div className="relative group shrink-0">
                      <img
                        src={editAvatarPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-primary shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={handleClearEditAvatar}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition-colors"
                        title="Remove avatar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="hidden"
                      id="edit-avatar-input"
                    />
                    <label
                      htmlFor="edit-avatar-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {editAvatarPreview ? "Replace photo" : "Upload photo"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 text-sm"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Testimonial?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete the testimonial from{" "}
                <span className="font-semibold text-gray-800">{deletingItem.name}</span>? This action
                cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingItem.id)}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-60 text-sm"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
