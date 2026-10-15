import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  MoveUp,
  MoveDown,
  X,
  UserCheck,
} from "lucide-react";
import type { TeamMember, TeamMemberCreate, TeamMemberUpdate } from "@shared/api";
import { adminFetch } from "@/lib/adminApi";
import { getApiBase } from "@/lib/apiBase";
import { toast } from "sonner";

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [order, setOrder] = useState<number>(1);
  const [active, setActive] = useState(true);
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState<{ filename: string; contentBase64: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`${getApiBase()}/api/admin/team`);
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setBio("");
    setOrder(members.length + 1);
    setActive(true);
    setEmail("");
    setLinkedinUrl("");
    setAvatarUrl("");
    setAvatarPreview("");
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (m: TeamMember) => {
    setEditingId(m.id);
    setName(m.name);
    setRole(m.role);
    setBio(m.bio || "");
    setOrder(m.order || 1);
    setActive(m.active !== false);
    setEmail(m.email || "");
    setLinkedinUrl(m.linkedinUrl || "");
    setAvatarUrl(m.avatarUrl || "");
    setAvatarPreview(m.avatarUrl || "");
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  // Handle avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file must be under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setAvatarPreview(b64);
      setAvatarFile({
        filename: file.name,
        contentBase64: b64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      toast.error("Member name and role/title are required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: TeamMemberCreate = {
        name: name.trim(),
        role: role.trim(),
        bio: bio.trim(),
        order: Number(order) || 1,
        active,
        email: email.trim(),
        linkedinUrl: linkedinUrl.trim(),
        avatarUrl: avatarUrl.trim() || "/logo_transparent.webp",
        avatarFile: avatarFile || undefined,
      };

      const url = editingId
        ? `${getApiBase()}/api/admin/team/${editingId}`
        : `${getApiBase()}/api/admin/team`;
      const method = editingId ? "PUT" : "POST";

      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save team member");
      }

      toast.success(editingId ? "Team member updated!" : "Team member added successfully!");
      setIsModalOpen(false);
      resetForm();
      await fetchMembers();
    } catch (e: any) {
      toast.error(e.message || "Error saving team member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;
    try {
      const res = await adminFetch(`${getApiBase()}/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Team member removed.");
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      toast.error("Failed to delete team member.");
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const newActive = !member.active;
      const res = await adminFetch(`${getApiBase()}/api/admin/team/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      if (res.ok) {
        toast.success(`Member is now ${newActive ? "active" : "hidden"}.`);
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, active: newActive } : m))
        );
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      (m.bio || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" /> About Us Presentation
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage instructors, faculty, and leadership shown on the website's continuous sliding carousel.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Main Table / Grid Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search team by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{members.length} team members total</span>
            <button
              type="button"
              onClick={fetchMembers}
              className="p-2 border rounded-xl hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading team members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">No team members found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Add your institute directors, instructors, and specialists to feature on the About Us page slider.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-xl"
            >
              Add Member Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/70 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-sm">
                    <img
                      src={m.avatarUrl || "/logo_transparent.webp"}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo_transparent.webp";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{m.name}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Order: {m.order}
                      </span>
                      {m.active !== false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Visible on Slider
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{m.role}</p>

                    {m.bio && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-2xl">{m.bio}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {m.email && <span>Email: {m.email}</span>}
                      {m.linkedinUrl && (
                        <a
                          href={m.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(m)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                      m.active !== false
                        ? "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {m.active !== false ? "Hide from Slider" : "Show on Slider"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-xl transition"
                    title="Edit Member"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(m.id, m.name)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                    title="Delete Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== ADD / EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingId ? "Edit Team Member" : "Add New Team Member"}
                </h3>
                <p className="text-xs text-gray-500">
                  This person will be featured in the continuous sliding strip on the About Us page.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-1">
              {/* Avatar Upload */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
                  Profile Photo / Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 shrink-0 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="team-avatar-input"
                    />
                    <label
                      htmlFor="team-avatar-input"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition"
                    >
                      <Upload className="w-3.5 h-3.5" /> Choose Photo from Device
                    </label>

                    <div>
                      <input
                        type="text"
                        placeholder="Or enter image URL (e.g. /ksohtc-8.webp)"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          if (!avatarFile) setAvatarPreview(e.target.value);
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Emmanuel NIYOBUHUNGIRO"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. HSE Specialist &amp; Trainer"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Brief Bio / Specialization
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Over 5 years in OSH training and international compliance..."
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />
              </div>

              {/* Order & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainer@ksoshtc.org"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  LinkedIn Profile URL (Optional)
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="active-member-toggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <label htmlFor="active-member-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Visible in continuous slider on the About Us page
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editingId ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
