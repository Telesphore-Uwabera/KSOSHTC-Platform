import { Fragment, useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  CheckCircle,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  X,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react";
import type { UserPublic, EnrollmentDoc, EnrollmentStatus, CourseDoc, LearnerSector } from "@shared/api";
import { getApiBase } from "@/lib/apiBase";
import { adminFetch } from "@/lib/adminApi";

const SECTOR_OPTIONS: { value: LearnerSector | ""; label: string }[] = [
  { value: "", label: "All Courses / Sectors" },
  { value: "construction", label: "Construction" },
  { value: "industrial-safety", label: "Industrial Safety" },
  { value: "mining", label: "Mining" },
  { value: "food-safety", label: "Food Safety" },
  { value: "safety-management", label: "Safety Management" },
  { value: "safe-lifting-operations", label: "Safe Lifting Operations" },
  { value: "fire-safety-and-egress", label: "Fire Safety & Egress" },
  { value: "esg", label: "ESG Principles" },
  { value: "first-aid", label: "First Aid & CPR" },
  { value: "iso-45001", label: "ISO 45001: OH&SMS" },
  { value: "iso-14011", label: "ISO 14011: EMS" },
];

type EnrollmentWithPerformance = EnrollmentDoc & {
  completionPercent: number;
  quizPerformance?: Record<string, { score: number; maxScore: number; percentage: number; passed: boolean }>;
};

type SortField =
  | "createdAt"
  | "name"
  | "invoiceNo"
  | "idCardNo"
  | "registrationNo"
  | "phone"
  | "coursePackage"
  | "course"
  | "admissionBatch"
  | "academicYear"
  | "approved"
  | "admissionTakenBy"
  | "totalFees"
  | "paymentAmount"
  | "balanceFee";

type SortOrder = "asc" | "desc";

async function fetchLearnersSummary(): Promise<{
  users: UserPublic[];
  enrollmentsByUserId: Record<string, EnrollmentWithPerformance[]>;
}> {
  const res = await adminFetch(getApiBase() + "/api/users/learners-summary");
  if (!res.ok) throw new Error("Failed to load learners");
  return res.json();
}

async function fetchCourses(): Promise<CourseDoc[]> {
  const res = await adminFetch(getApiBase() + "/api/course-content/courses");
  if (!res.ok) return [];
  const data = await res.json();
  return (data.courses ?? []).filter((c: CourseDoc) => c.published !== false);
}

async function approveUser(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}/approve`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to approve user");
}

async function updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/enrollments/${enrollmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update enrollment");
}

async function addEnrollment(userId: string, courseId: string): Promise<void> {
  const res = await adminFetch(getApiBase() + "/api/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, courseId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to add course enrollment");
  }
}

async function createLearner(body: Partial<UserPublic> & { password?: string }): Promise<UserPublic> {
  const res = await adminFetch(getApiBase() + "/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to create learner");
  }
  const data = await res.json();
  return (data as { user: UserPublic }).user;
}

async function updateLearner(
  id: string,
  body: Partial<UserPublic> & { password?: string }
): Promise<UserPublic> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to update learner");
  }
  const data = await res.json();
  return (data as { user: UserPublic }).user;
}

async function deleteLearner(id: string): Promise<void> {
  const res = await adminFetch(getApiBase() + `/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to delete learner");
  }
}

async function syncStudentIds(): Promise<{ success: boolean; count: number }> {
  const res = await adminFetch(getApiBase() + "/api/users/sync-student-ids", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to sync student IDs");
  return res.json();
}

function formatLearnerDate(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, "0");
    return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

const statusLabel: Record<string, string> = {
  not_approved: "Not approved",
  active: "Active",
  completed: "Completed",
};

const statusClass: Record<string, string> = {
  not_approved: "bg-amber-100 text-amber-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function AdminLearners() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserPublic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("");
  const [filterBatch, setFilterBatch] = useState<string>("");
  const [filterTakenBy, setFilterTakenBy] = useState<string>("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(true);

  // Sorting State
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form states for Create / Edit
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOrg, setFormOrg] = useState("");
  const [formSector, setFormSector] = useState<LearnerSector | "">("");
  const [formApproved, setFormApproved] = useState(false);
  const [formIdCardNo, setFormIdCardNo] = useState("");
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formRegistrationNo, setFormRegistrationNo] = useState("");
  const [formCoursePackage, setFormCoursePackage] = useState("");
  const [formAdmissionBatch, setFormAdmissionBatch] = useState("");
  const [formAcademicYear, setFormAcademicYear] = useState("");
  const [formAdmissionTakenBy, setFormAdmissionTakenBy] = useState("");
  const [formTotalFees, setFormTotalFees] = useState<number | string>(150000);
  const [formPaymentAmount, setFormPaymentAmount] = useState<number | string>(150000);
  const [formBalanceFee, setFormBalanceFee] = useState<number | string>(0);
  const [formError, setFormError] = useState("");
  const [courseToAddByUserId, setCourseToAddByUserId] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["learners-summary"],
    queryFn: fetchLearnersSummary,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["course-content", "courses"],
    queryFn: fetchCourses,
  });

  const approveMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ enrollmentId, status }: { enrollmentId: string; status: EnrollmentStatus }) =>
      updateEnrollmentStatus(enrollmentId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const addEnrollmentMutation = useMutation({
    mutationFn: ({ userId, courseId }: { userId: string; courseId: string }) =>
      addEnrollment(userId, courseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learners-summary"] }),
  });

  const syncMutation = useMutation({
    mutationFn: syncStudentIds,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setSyncMessage(`Successfully synchronized ${res.count} student IDs!`);
      setTimeout(() => setSyncMessage(null), 4000);
    },
    onError: (err: Error) => {
      setSyncMessage(`Failed to sync: ${err.message}`);
      setTimeout(() => setSyncMessage(null), 5000);
    },
  });

  const createMutation = useMutation({
    mutationFn: createLearner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateLearner>[1] }) =>
      updateLearner(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setEditUser(null);
      resetForm();
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLearner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learners-summary"] });
      setDeleteId(null);
    },
    onError: (e: Error) => setFormError(e.message),
  });

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPhone("");
    setFormOrg("");
    setFormSector("");
    setFormApproved(false);
    setFormIdCardNo("");
    setFormInvoiceNo("");
    setFormRegistrationNo("");
    setFormCoursePackage("Standard");
    setFormAdmissionBatch("Mr Sooraj Jacob");
    setFormAcademicYear("2026-2027");
    setFormAdmissionTakenBy("Dipali Kumari Agarwal");
    setFormTotalFees(150000);
    setFormPaymentAmount(150000);
    setFormBalanceFee(0);
    setFormError("");
  }

  function openEdit(u: UserPublic) {
    setEditUser(u);
    setFormName(u.name || "");
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormPhone(u.phone || "");
    setFormOrg(u.organization ?? "");
    setFormSector(u.sector ?? "");
    setFormApproved(u.approved ?? false);
    setFormIdCardNo(u.idCardNo ?? "");
    setFormInvoiceNo(u.invoiceNo ?? "");
    setFormRegistrationNo(u.registrationNo ?? "");
    setFormCoursePackage(u.coursePackage ?? "Standard");
    setFormAdmissionBatch(u.admissionBatch ?? "Mr Sooraj Jacob");
    setFormAcademicYear(u.academicYear ?? "2026-2027");
    setFormAdmissionTakenBy(u.admissionTakenBy ?? "Dipali Kumari Agarwal");
    setFormTotalFees(u.totalFees !== undefined ? u.totalFees : 150000);
    setFormPaymentAmount(u.paymentAmount !== undefined ? u.paymentAmount : (u.approved ? 150000 : 0));
    setFormBalanceFee(u.balanceFee !== undefined ? u.balanceFee : 0);
    setFormError("");
  }

  const courseTitleById = useMemo(() => {
    return Object.fromEntries((courses || []).map((c) => [c.id, c.title]));
  }, [courses]);

  const rawUsers = data?.users ?? [];
  const enrollmentsByUserId = data?.enrollmentsByUserId ?? {};

  // Extract unique options for filter dropdowns
  const uniqueAcademicYears = useMemo(() => {
    const set = new Set<string>();
    rawUsers.forEach((u) => {
      if (u.academicYear) set.add(u.academicYear);
    });
    return Array.from(set).sort().reverse();
  }, [rawUsers]);

  const uniqueBatches = useMemo(() => {
    const set = new Set<string>();
    rawUsers.forEach((u) => {
      if (u.admissionBatch) set.add(u.admissionBatch);
    });
    return Array.from(set).sort();
  }, [rawUsers]);

  const uniqueTakenBy = useMemo(() => {
    const set = new Set<string>();
    rawUsers.forEach((u) => {
      if (u.admissionTakenBy) set.add(u.admissionTakenBy);
    });
    return Array.from(set).sort();
  }, [rawUsers]);

  function getLearnerCourseDisplay(u: UserPublic, enrollments: EnrollmentWithPerformance[]): string {
    if (enrollments && enrollments.length > 0) {
      return enrollments.map((e) => courseTitleById[e.courseId] || e.courseId).join(", ");
    }
    const sectorLabel = SECTOR_OPTIONS.find((o) => o.value === u.sector)?.label;
    if (sectorLabel && sectorLabel !== "All Courses / Sectors") return sectorLabel;
    return "Environmental, Social, and Governance (ESG)";
  }

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filterSector) count++;
    if (filterStatus) count++;
    if (filterAcademicYear) count++;
    if (filterBatch) count++;
    if (filterTakenBy) count++;
    if (filterPaymentStatus) count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    return count;
  }, [
    searchTerm,
    filterSector,
    filterStatus,
    filterAcademicYear,
    filterBatch,
    filterTakenBy,
    filterPaymentStatus,
    filterDateFrom,
    filterDateTo,
  ]);

  function clearAllFilters() {
    setSearchTerm("");
    setFilterSector("");
    setFilterStatus("");
    setFilterAcademicYear("");
    setFilterBatch("");
    setFilterTakenBy("");
    setFilterPaymentStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return rawUsers.filter((u) => {
      // 1. Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const enrollments = enrollmentsByUserId[u.id] ?? [];
        const courseStr = getLearnerCourseDisplay(u, enrollments).toLowerCase();
        const match =
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.idCardNo && u.idCardNo.toLowerCase().includes(term)) ||
          (u.invoiceNo && u.invoiceNo.toLowerCase().includes(term)) ||
          (u.registrationNo && u.registrationNo.toLowerCase().includes(term)) ||
          (u.phone && u.phone.toLowerCase().includes(term)) ||
          (u.organization && u.organization.toLowerCase().includes(term)) ||
          (u.admissionBatch && u.admissionBatch.toLowerCase().includes(term)) ||
          (u.admissionTakenBy && u.admissionTakenBy.toLowerCase().includes(term)) ||
          courseStr.includes(term);
        if (!match) return false;
      }

      // 2. Sector / Course Filter
      if (filterSector) {
        if (u.sector !== filterSector) {
          // Also check if they are enrolled in a course with this sector
          const enrollments = enrollmentsByUserId[u.id] ?? [];
          const hasCourse = enrollments.some((e) => e.courseId === filterSector);
          if (!hasCourse) return false;
        }
      }

      // 3. Status Filter
      if (filterStatus) {
        if (filterStatus === "active" && !u.approved) return false;
        if (filterStatus === "pending" && u.approved) return false;
      }

      // 4. Academic Year Filter
      if (filterAcademicYear) {
        if ((u.academicYear || "2026-2027") !== filterAcademicYear) return false;
      }

      // 5. Admission Batch Filter
      if (filterBatch) {
        if ((u.admissionBatch || "Mr Sooraj Jacob") !== filterBatch) return false;
      }

      // 6. Admission Taken By Filter
      if (filterTakenBy) {
        if ((u.admissionTakenBy || "") !== filterTakenBy) return false;
      }

      // 7. Payment / Balance Status Filter
      if (filterPaymentStatus) {
        const bal = Number(u.balanceFee !== undefined ? u.balanceFee : 0);
        const pay = Number(u.paymentAmount !== undefined ? u.paymentAmount : 0);
        if (filterPaymentStatus === "paid" && bal > 0) return false;
        if (filterPaymentStatus === "pending" && bal <= 0) return false;
        if (filterPaymentStatus === "unpaid" && pay > 0) return false;
      }

      // 8. Date Range Filter
      if (filterDateFrom || filterDateTo) {
        const userDate = u.createdAt ? new Date(u.createdAt).getTime() : 0;
        if (filterDateFrom) {
          const fromTime = new Date(filterDateFrom).setHours(0, 0, 0, 0);
          if (userDate < fromTime) return false;
        }
        if (filterDateTo) {
          const toTime = new Date(filterDateTo).setHours(23, 59, 59, 999);
          if (userDate > toTime) return false;
        }
      }

      return true;
    });
  }, [
    rawUsers,
    searchTerm,
    filterSector,
    filterStatus,
    filterAcademicYear,
    filterBatch,
    filterTakenBy,
    filterPaymentStatus,
    filterDateFrom,
    filterDateTo,
    enrollmentsByUserId,
  ]);

  // Sorting Logic
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortField) {
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "invoiceNo":
          aVal = parseInt(a.invoiceNo || "0", 10) || (a.invoiceNo || "");
          bVal = parseInt(b.invoiceNo || "0", 10) || (b.invoiceNo || "");
          break;
        case "idCardNo":
          aVal = a.idCardNo || "";
          bVal = b.idCardNo || "";
          break;
        case "registrationNo":
          aVal = parseInt(a.registrationNo || "0", 10) || (a.registrationNo || "");
          bVal = parseInt(b.registrationNo || "0", 10) || (b.registrationNo || "");
          break;
        case "phone":
          aVal = a.phone || "";
          bVal = b.phone || "";
          break;
        case "coursePackage":
          aVal = a.coursePackage || "Standard";
          bVal = b.coursePackage || "Standard";
          break;
        case "course":
          aVal = getLearnerCourseDisplay(a, enrollmentsByUserId[a.id] ?? []);
          bVal = getLearnerCourseDisplay(b, enrollmentsByUserId[b.id] ?? []);
          break;
        case "admissionBatch":
          aVal = a.admissionBatch || "";
          bVal = b.admissionBatch || "";
          break;
        case "academicYear":
          aVal = a.academicYear || "";
          bVal = b.academicYear || "";
          break;
        case "approved":
          aVal = a.approved ? 1 : 0;
          bVal = b.approved ? 1 : 0;
          break;
        case "admissionTakenBy":
          aVal = a.admissionTakenBy || "";
          bVal = b.admissionTakenBy || "";
          break;
        case "totalFees":
          aVal = Number(a.totalFees || 0);
          bVal = Number(b.totalFees || 0);
          break;
        case "paymentAmount":
          aVal = Number(a.paymentAmount || 0);
          bVal = Number(b.paymentAmount || 0);
          break;
        case "balanceFee":
          aVal = Number(a.balanceFee || 0);
          bVal = Number(b.balanceFee || 0);
          break;
        default:
          aVal = a.createdAt || "";
          bVal = b.createdAt || "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortOrder, enrollmentsByUserId]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  // Pagination State (Default: 10 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Reset to page 1 whenever any filter or search or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterSector,
    filterStatus,
    filterAcademicYear,
    filterBatch,
    filterTakenBy,
    filterPaymentStatus,
    filterDateFrom,
    filterDateTo,
    pageSize,
  ]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push("...");
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push("...");
    }
    pages.push(total);
    return pages;
  }

  // Totals calculated from filtered/sorted users
  const { totalFeesSum, paymentSum, balanceSum } = useMemo(() => {
    let tf = 0;
    let pm = 0;
    let bf = 0;
    for (const u of sortedUsers) {
      if (u.id === "admin") continue;
      const t = Number(u.totalFees || 150000);
      const p = Number(u.paymentAmount !== undefined ? u.paymentAmount : (u.approved ? 150000 : 0));
      const b = Number(u.balanceFee !== undefined ? u.balanceFee : 0);
      tf += t;
      pm += p;
      bf += b;
    }
    return { totalFeesSum: tf, paymentSum: pm, balanceSum: bf };
  }, [sortedUsers]);

  // Selection handlers (selects items on the current active page)
  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.delete(u.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.add(u.id));
        return next;
      });
    }
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Export to CSV
  function exportToCsv() {
    const listToExport =
      selectedIds.size > 0
        ? sortedUsers.filter((u) => selectedIds.has(u.id))
        : sortedUsers;

    const headers = [
      "DATE",
      "STUDENT",
      "EMAIL",
      "INVOICE#",
      "ID CARD#",
      "REGISTRATION#",
      "MOBILE",
      "COURSE PACKAGE",
      "COURSE",
      "ADMISSION BATCH",
      "ACADEMIC YEAR",
      "STATUS",
      "ADMISSION TAKEN BY",
      "TOTAL FEES",
      "PAYMENT",
      "BALANCE",
    ];

    const rows = listToExport.map((u) => {
      const course = getLearnerCourseDisplay(u, enrollmentsByUserId[u.id] ?? []);
      return [
        `"${formatLearnerDate(u.createdAt)}"`,
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${(u.email || "").replace(/"/g, '""')}"`,
        `"${u.invoiceNo || ""}"`,
        `"${u.idCardNo || ""}"`,
        `"${u.registrationNo || u.invoiceNo || ""}"`,
        `"${u.phone || ""}"`,
        `"${u.coursePackage || "Standard"}"`,
        `"${course.replace(/"/g, '""')}"`,
        `"${(u.admissionBatch || "").replace(/"/g, '""')}"`,
        `"${u.academicYear || "2026-2027"}"`,
        `"${u.approved ? "Active" : "Pending"}"`,
        `"${(u.admissionTakenBy || "").replace(/"/g, '""')}"`,
        u.totalFees || 150000,
        u.paymentAmount !== undefined ? u.paymentAmount : (u.approved ? 150000 : 0),
        u.balanceFee !== undefined ? u.balanceFee : 0,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `learners_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary font-bold" />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-2 mb-1">
              <Users className="w-7 h-7" />
              Learners management
            </h1>
            <p className="text-gray-600 text-sm">
              View, filter, sort, and manage learner records, student IDs (e.g. <code>2026-CONS-004</code>), payments, and course enrollments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormApproved(false);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create learner
            </button>
            <button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition-all"
              title="Update and synchronize all learner student IDs to the sector format (e.g. YYYY-CONS-004)"
            >
              {syncMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Update Student IDs
            </button>
            <button
              type="button"
              onClick={exportToCsv}
              disabled={sortedUsers.length === 0}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 shadow-sm transition-all border border-gray-200"
              title="Export current learners view to CSV spreadsheet"
            >
              <Download className="w-4 h-4 text-gray-600" />
              Export CSV
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {syncMessage}
          </div>
        )}

        {/* Search & Filter Controls Toolbar */}
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Universal Search Bar */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student name, email, student ID card#, invoice#, mobile..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle Filters Panel & Clear */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  showFiltersPanel
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFiltersPanel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
              {/* Filter 1: Course / Sector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Course / Sector
                </label>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  {SECTOR_OPTIONS.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Admission Status */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Admission Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active (Approved)</option>
                  <option value="pending">Pending (Not Approved)</option>
                </select>
              </div>

              {/* Filter 3: Academic Year */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Academic Year
                </label>
                <select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  <option value="">All Academic Years</option>
                  {uniqueAcademicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Payment / Balance Status */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Payment Status
                </label>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  <option value="">All Payments</option>
                  <option value="paid">Paid in Full (0 Balance)</option>
                  <option value="pending">Has Pending Balance</option>
                  <option value="unpaid">Unpaid (0 Payment)</option>
                </select>
              </div>

              {/* Filter 5: Admission Batch */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Admission Batch
                </label>
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  <option value="">All Batches</option>
                  {uniqueBatches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 6: Admission Taken By */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Admission Taken By
                </label>
                <select
                  value={filterTakenBy}
                  onChange={(e) => setFilterTakenBy(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                >
                  <option value="">All Agents</option>
                  {uniqueTakenBy.map((tb) => (
                    <option key={tb} value={tb}>
                      {tb}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 7: From Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> From Date
                </label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                />
              </div>

              {/* Filter 8: To Date */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" /> To Date
                </label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Results Summary & Selection Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-gray-500 font-medium">
            <div>
              Showing <span className="font-bold text-gray-900">{sortedUsers.length}</span> of{" "}
              <span className="font-bold text-gray-900">{rawUsers.length}</span> learners
              {selectedIds.size > 0 && (
                <span className="ml-2 font-bold text-primary">
                  ({selectedIds.size} selected)
                </span>
              )}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    selectedIds.forEach((id) => {
                      const u = rawUsers.find((x) => x.id === id);
                      if (u && !u.approved) approveMutation.mutate(id);
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 text-xs shadow-sm"
                >
                  Approve selected ({selectedIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-gray-500 hover:text-gray-800 underline text-xs"
                >
                  Deselect all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <p className="text-gray-500 text-sm mt-6 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading learners data…
          </p>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 text-sm font-semibold">No learners match your filter criteria.</p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[1700px] text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/90 text-gray-700 select-none">
                  {/* Select Checkbox Column */}
                  <th className="px-3 py-3.5 text-center min-w-[40px] w-[40px]">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-gray-400 hover:text-primary transition-colors"
                      title={allSelected ? "Deselect All" : "Select All"}
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>

                  {/* 1. DATE */}
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[160px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>DATE</span>
                      {renderSortIcon("createdAt")}
                    </div>
                  </th>

                  {/* 2. STUDENT */}
                  <th
                    onClick={() => handleSort("name")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[220px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>STUDENT</span>
                      {renderSortIcon("name")}
                    </div>
                  </th>

                  {/* 3. INVOICE# */}
                  <th
                    onClick={() => handleSort("invoiceNo")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[100px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>INVOICE#</span>
                      {renderSortIcon("invoiceNo")}
                    </div>
                  </th>

                  {/* 4. ID CARD# */}
                  <th
                    onClick={() => handleSort("idCardNo")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[140px] text-primary cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID CARD#</span>
                      {renderSortIcon("idCardNo")}
                    </div>
                  </th>

                  {/* 5. REGISTRATION# */}
                  <th
                    onClick={() => handleSort("registrationNo")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>REGISTRATION#</span>
                      {renderSortIcon("registrationNo")}
                    </div>
                  </th>

                  {/* 6. MOBILE */}
                  <th
                    onClick={() => handleSort("phone")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[120px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>MOBILE</span>
                      {renderSortIcon("phone")}
                    </div>
                  </th>

                  {/* 7. COURSE PACKAGE */}
                  <th
                    onClick={() => handleSort("coursePackage")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[140px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>COURSE PACKAGE</span>
                      {renderSortIcon("coursePackage")}
                    </div>
                  </th>

                  {/* 8. COURSE */}
                  <th
                    onClick={() => handleSort("course")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[260px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>COURSE</span>
                      {renderSortIcon("course")}
                    </div>
                  </th>

                  {/* 9. ADMISSION BATCH */}
                  <th
                    onClick={() => handleSort("admissionBatch")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[150px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ADMISSION BATCH</span>
                      {renderSortIcon("admissionBatch")}
                    </div>
                  </th>

                  {/* 10. ACADEMIC YEAR */}
                  <th
                    onClick={() => handleSort("academicYear")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ACADEMIC YEAR</span>
                      {renderSortIcon("academicYear")}
                    </div>
                  </th>

                  {/* 11. STATUS */}
                  <th
                    onClick={() => handleSort("approved")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[110px] text-center cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>STATUS</span>
                      {renderSortIcon("approved")}
                    </div>
                  </th>

                  {/* 12. ADMISSION TAKEN BY */}
                  <th
                    onClick={() => handleSort("admissionTakenBy")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[180px] cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ADMISSION TAKEN BY</span>
                      {renderSortIcon("admissionTakenBy")}
                    </div>
                  </th>

                  {/* 13. TOTAL FEES */}
                  <th
                    onClick={() => handleSort("totalFees")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[120px] text-right cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>TOTAL FEES</span>
                      {renderSortIcon("totalFees")}
                    </div>
                  </th>

                  {/* 14. PAYMENT */}
                  <th
                    onClick={() => handleSort("paymentAmount")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[110px] text-right text-emerald-700 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>PAYMENT</span>
                      {renderSortIcon("paymentAmount")}
                    </div>
                  </th>

                  {/* 15. BALANCE */}
                  <th
                    onClick={() => handleSort("balanceFee")}
                    className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[110px] text-right text-amber-700 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>BALANCE</span>
                      {renderSortIcon("balanceFee")}
                    </div>
                  </th>

                  {/* ACTIONS */}
                  <th className="px-3.5 py-3.5 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[130px] text-center">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.map((u) => {
                  const enrollments = enrollmentsByUserId[u.id] ?? [];
                  const isExpanded = expandedId === u.id;
                  const courseDisplay = getLearnerCourseDisplay(u, enrollments);
                  const isSelected = selectedIds.has(u.id);

                  return (
                    <Fragment key={u.id}>
                      <tr
                        className={`transition-colors group ${
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-blue-50/30"
                        }`}
                      >
                        {/* Select Checkbox */}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(u.id)}
                            className="text-gray-400 hover:text-primary transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* 1. DATE */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-gray-600 font-medium font-mono text-xs">
                          {formatLearnerDate(u.createdAt)}
                        </td>

                        {/* 2. STUDENT */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : u.id)}
                            className="flex items-center gap-2 text-left group/btn"
                            title="Click to expand course enrollments & curriculum progress"
                          >
                            {enrollments.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 group-hover/btn:text-primary transition-colors" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0 group-hover/btn:text-primary transition-colors" />
                              )
                            ) : (
                              <span className="w-4 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-gray-900 group-hover/btn:text-primary transition-colors uppercase">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono lowercase">
                                {u.email}
                              </div>
                            </div>
                          </button>
                        </td>

                        {/* 3. INVOICE# */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono text-gray-700 font-semibold">
                          {u.invoiceNo || "—"}
                        </td>

                        {/* 4. ID CARD# (e.g. 2026-CONS-004, 2026-MIN-003) */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono font-bold text-primary">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                            {u.idCardNo || "—"}
                          </span>
                        </td>

                        {/* 5. REGISTRATION# */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono text-gray-700 font-semibold">
                          {u.registrationNo || u.invoiceNo || "—"}
                        </td>

                        {/* 6. MOBILE */}
                        <td className="px-3.5 py-3 whitespace-nowrap font-mono text-gray-700">
                          {u.phone || "—"}
                        </td>

                        {/* 7. COURSE PACKAGE */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-gray-600">
                          {u.coursePackage || "Standard"}
                        </td>

                        {/* 8. COURSE */}
                        <td
                          className="px-3.5 py-3 whitespace-nowrap text-gray-800 font-medium max-w-[280px] truncate"
                          title={courseDisplay}
                        >
                          {courseDisplay}
                        </td>

                        {/* 9. ADMISSION BATCH */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-gray-700">
                          {u.admissionBatch || "Mr Sooraj Jacob"}
                        </td>

                        {/* 10. ACADEMIC YEAR */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-gray-700">
                          {u.academicYear || "2026-2027"}
                        </td>

                        {/* 11. STATUS */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border ${
                              u.approved
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {u.approved ? "Active" : "Pending"}
                          </span>
                        </td>

                        {/* 12. ADMISSION TAKEN BY */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-gray-700">
                          {u.admissionTakenBy || "Dipali Kumari Agarwal"}
                        </td>

                        {/* 13. TOTAL FEES */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono font-bold text-gray-900">
                          {Number(u.totalFees || 150000).toLocaleString()}
                        </td>

                        {/* 14. PAYMENT */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono font-bold text-emerald-700">
                          {Number(
                            u.paymentAmount !== undefined ? u.paymentAmount : (u.approved ? 150000 : 0)
                          ).toLocaleString()}
                        </td>

                        {/* 15. BALANCE */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono font-bold text-amber-700">
                          {Number(u.balanceFee !== undefined ? u.balanceFee : 0).toLocaleString()}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-3.5 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!u.approved && (
                              <button
                                type="button"
                                onClick={() => approveMutation.mutate(u.id)}
                                disabled={approveMutation.isPending}
                                className="inline-flex items-center gap-1 bg-primary text-white px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm transition-all"
                                title="Approve learner access"
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm transition-all"
                              title="Edit learner"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== "admin" && (
                              <button
                                type="button"
                                onClick={() => setDeleteId(u.id)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 shadow-sm transition-all"
                                title="Delete learner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Course Enrollment & Curriculum Breakdown */}
                      {isExpanded && (
                        <tr className="bg-blue-50/20 border-b border-gray-100">
                          <td colSpan={17} className="px-6 py-4">
                            <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-primary" />
                                  Course Enrollments & Assessment Progress ({enrollments.length})
                                </p>

                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const enrolled = new Set((enrollments || []).map((en) => en.courseId));
                                    const available = courses.filter((c) => !enrolled.has(c.id));
                                    if (available.length === 0) return null;
                                    const selected = courseToAddByUserId[u.id] ?? available[0].id;
                                    return (
                                      <>
                                        <select
                                          value={selected}
                                          onChange={(e) =>
                                            setCourseToAddByUserId((prev) => ({
                                              ...prev,
                                              [u.id]: e.target.value,
                                            }))
                                          }
                                          className="text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white outline-none focus:border-primary"
                                        >
                                          {available.map((c) => (
                                            <option key={c.id} value={c.id}>
                                              {c.title}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            addEnrollmentMutation.mutate({
                                              userId: u.id,
                                              courseId: selected,
                                            })
                                          }
                                          disabled={addEnrollmentMutation.isPending}
                                          className="inline-flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                                        >
                                          {addEnrollmentMutation.isPending ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Plus className="w-3.5 h-3.5" />
                                          )}
                                          Assign course
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {enrollments.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-2">
                                  No specific courses assigned yet. Learner has access to their sector-specific curriculum upon sign-in.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {enrollments.map((en) => (
                                    <div
                                      key={en.id}
                                      className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col gap-2.5"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="font-bold text-gray-900 text-sm">
                                          {courseTitleById[en.courseId] ?? en.courseId}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                                              statusClass[en.status ?? "active"] ?? statusClass.active
                                            }`}
                                          >
                                            {statusLabel[en.status ?? "active"] ?? "Active"}
                                          </span>
                                          <select
                                            value={en.status ?? "active"}
                                            onChange={(e) =>
                                              updateStatusMutation.mutate({
                                                enrollmentId: en.id,
                                                status: e.target.value as EnrollmentStatus,
                                              })
                                            }
                                            disabled={updateStatusMutation.isPending}
                                            className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white outline-none focus:border-primary"
                                          >
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="not_approved">Not approved</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div>
                                        <div className="flex justify-between items-center text-xs font-semibold mb-1 text-gray-600">
                                          <span>Curriculum Progress</span>
                                          <span className="text-primary font-bold">{en.completionPercent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${en.completionPercent}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Quiz Performance Badges */}
                                      {en.quizPerformance && Object.keys(en.quizPerformance).length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                                          {Object.entries(en.quizPerformance).map(([qId, perf]) => (
                                            <div
                                              key={qId}
                                              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 ${
                                                perf.passed
                                                  ? "bg-green-50 border-green-200 text-green-700"
                                                  : "bg-amber-50 border-amber-200 text-amber-700"
                                              }`}
                                              title={`Score: ${perf.score}/${perf.maxScore}`}
                                            >
                                              <div
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                  perf.passed ? "bg-green-500" : "bg-amber-500"
                                                }`}
                                              />
                                              Quiz: {perf.percentage}%
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>

              {/* Bottom Summary Footer Row */}
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50/95 font-bold text-gray-900 text-xs sm:text-sm">
                  <td colSpan={13} className="px-4 py-4 text-right font-black uppercase tracking-wider text-gray-800 text-sm">
                    Total
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono font-black text-gray-900 whitespace-nowrap text-sm">
                    {totalFeesSum.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono font-black text-emerald-700 whitespace-nowrap text-sm">
                    {paymentSum.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono font-black text-amber-700 whitespace-nowrap text-sm">
                    {balanceSum.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination Controls (< 1, 2, 3, 4, 5 next >) */}
          {sortedUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
                <span>
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min((currentPage - 1) * pageSize + 1, sortedUsers.length)}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * pageSize, sortedUsers.length)}
                  </span>{" "}
                  of <span className="font-bold text-gray-900">{sortedUsers.length}</span> learners
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg bg-white text-xs font-semibold text-gray-700 outline-none focus:border-primary shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Pages Navigation: < 1 2 3 4 5 ... next > */}
              <div className="flex items-center gap-1.5 select-none">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                  title="Previous Page"
                >
                  &lt; Previous
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-gray-400 font-bold select-none">
                          …
                        </span>
                      );
                    }
                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isActive
                            ? "bg-primary text-white hover:bg-primary/95"
                            : "border border-gray-200 text-gray-700 hover:bg-gray-100 bg-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                  title="Next Page"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Create Learner Modal */}
        {createOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setCreateOpen(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold text-primary">Create New Learner</h2>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g. Emmanuel NIYOBUHUNGIRO"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    placeholder="e.g. learner@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    placeholder="Temporary password"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 785072512"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student ID Card# (Optional)</label>
                  <input
                    type="text"
                    value={formIdCardNo}
                    onChange={(e) => setFormIdCardNo(e.target.value)}
                    placeholder="Leave blank to auto-generate (e.g. 2026-CONS-001)"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sector of Interest</label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value as LearnerSector | "")}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary outline-none"
                  >
                    {SECTOR_OPTIONS.filter((o) => o.value !== "").map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Invoice#</label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    placeholder="e.g. 7395"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registration#</label>
                  <input
                    type="text"
                    value={formRegistrationNo}
                    onChange={(e) => setFormRegistrationNo(e.target.value)}
                    placeholder="e.g. 7395"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Course Package</label>
                  <input
                    type="text"
                    value={formCoursePackage}
                    onChange={(e) => setFormCoursePackage(e.target.value)}
                    placeholder="e.g. Standard"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admission Batch</label>
                  <input
                    type="text"
                    value={formAdmissionBatch}
                    onChange={(e) => setFormAdmissionBatch(e.target.value)}
                    placeholder="e.g. Mr Sooraj Jacob"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    placeholder="e.g. 2026-2027"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admission Taken By</label>
                  <input
                    type="text"
                    value={formAdmissionTakenBy}
                    onChange={(e) => setFormAdmissionTakenBy(e.target.value)}
                    placeholder="e.g. Dipali Kumari Agarwal"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Fees (RWF)</label>
                  <input
                    type="number"
                    value={formTotalFees}
                    onChange={(e) => {
                      const tf = Number(e.target.value);
                      setFormTotalFees(e.target.value);
                      const pm = Number(formPaymentAmount || 0);
                      setFormBalanceFee(Math.max(0, tf - pm));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment (RWF)</label>
                  <input
                    type="number"
                    value={formPaymentAmount}
                    onChange={(e) => {
                      const pm = Number(e.target.value);
                      setFormPaymentAmount(e.target.value);
                      const tf = Number(formTotalFees || 0);
                      setFormBalanceFee(Math.max(0, tf - pm));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Balance (RWF)</label>
                  <input
                    type="number"
                    value={formBalanceFee}
                    onChange={(e) => setFormBalanceFee(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Organization</label>
                  <input
                    type="text"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    placeholder="Company or school name"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formApproved}
                    onChange={(e) => setFormApproved(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Approve immediately (grant instant platform access)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formName.trim() || !formEmail.trim() || !formPassword) {
                      setFormError("Name, email, and password are required.");
                      return;
                    }
                    createMutation.mutate({
                      name: formName.trim(),
                      email: formEmail.trim(),
                      password: formPassword,
                      phone: formPhone.trim() || undefined,
                      organization: formOrg.trim() || undefined,
                      sector: formSector || undefined,
                      approved: formApproved,
                      idCardNo: formIdCardNo.trim() || undefined,
                      invoiceNo: formInvoiceNo.trim() || undefined,
                      registrationNo: formRegistrationNo.trim() || undefined,
                      coursePackage: formCoursePackage.trim() || undefined,
                      admissionBatch: formAdmissionBatch.trim() || undefined,
                      academicYear: formAcademicYear.trim() || undefined,
                      admissionTakenBy: formAdmissionTakenBy.trim() || undefined,
                      totalFees: Number(formTotalFees || 0),
                      paymentAmount: Number(formPaymentAmount || 0),
                      balanceFee: Number(formBalanceFee || 0),
                    });
                  }}
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                >
                  {createMutation.isPending ? "Creating…" : "Create Learner"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Learner Modal */}
        {editUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setEditUser(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-xl font-bold text-primary">Edit Learner Details</h2>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student ID Card#</label>
                  <input
                    type="text"
                    value={formIdCardNo}
                    onChange={(e) => setFormIdCardNo(e.target.value)}
                    placeholder="e.g. 2026-CONS-004 or 2026-MIN-003"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono font-bold text-primary text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 785072512"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Password (leave blank to keep)</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Optional new password"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sector of Interest</label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value as LearnerSector | "")}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary outline-none"
                  >
                    {SECTOR_OPTIONS.filter((o) => o.value !== "").map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Invoice#</label>
                  <input
                    type="text"
                    value={formInvoiceNo}
                    onChange={(e) => setFormInvoiceNo(e.target.value)}
                    placeholder="e.g. 7395"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registration#</label>
                  <input
                    type="text"
                    value={formRegistrationNo}
                    onChange={(e) => setFormRegistrationNo(e.target.value)}
                    placeholder="e.g. 7395"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Course Package</label>
                  <input
                    type="text"
                    value={formCoursePackage}
                    onChange={(e) => setFormCoursePackage(e.target.value)}
                    placeholder="e.g. Standard"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admission Batch</label>
                  <input
                    type="text"
                    value={formAdmissionBatch}
                    onChange={(e) => setFormAdmissionBatch(e.target.value)}
                    placeholder="e.g. Mr Sooraj Jacob"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    placeholder="e.g. 2026-2027"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Admission Taken By</label>
                  <input
                    type="text"
                    value={formAdmissionTakenBy}
                    onChange={(e) => setFormAdmissionTakenBy(e.target.value)}
                    placeholder="e.g. Dipali Kumari Agarwal"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Total Fees (RWF)</label>
                  <input
                    type="number"
                    value={formTotalFees}
                    onChange={(e) => {
                      const tf = Number(e.target.value);
                      setFormTotalFees(e.target.value);
                      const pm = Number(formPaymentAmount || 0);
                      setFormBalanceFee(Math.max(0, tf - pm));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment (RWF)</label>
                  <input
                    type="number"
                    value={formPaymentAmount}
                    onChange={(e) => {
                      const pm = Number(e.target.value);
                      setFormPaymentAmount(e.target.value);
                      const tf = Number(formTotalFees || 0);
                      setFormBalanceFee(Math.max(0, tf - pm));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Balance (RWF)</label>
                  <input
                    type="number"
                    value={formBalanceFee}
                    onChange={(e) => setFormBalanceFee(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Organization</label>
                  <input
                    type="text"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formApproved}
                    onChange={(e) => setFormApproved(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Approved (active access to platform & curriculum)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formName.trim() || !formEmail.trim()) {
                      setFormError("Name and email are required.");
                      return;
                    }
                    updateMutation.mutate({
                      id: editUser.id,
                      body: {
                        name: formName.trim(),
                        email: formEmail.trim(),
                        password: formPassword || undefined,
                        phone: formPhone.trim() || undefined,
                        organization: formOrg.trim() || undefined,
                        sector: formSector || undefined,
                        approved: formApproved,
                        idCardNo: formIdCardNo.trim() || undefined,
                        invoiceNo: formInvoiceNo.trim() || undefined,
                        registrationNo: formRegistrationNo.trim() || undefined,
                        coursePackage: formCoursePackage.trim() || undefined,
                        admissionBatch: formAdmissionBatch.trim() || undefined,
                        academicYear: formAcademicYear.trim() || undefined,
                        admissionTakenBy: formAdmissionTakenBy.trim() || undefined,
                        totalFees: Number(formTotalFees || 0),
                        paymentAmount: Number(formPaymentAmount || 0),
                        balanceFee: Number(formBalanceFee || 0),
                      },
                    });
                  }}
                  disabled={updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                >
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-900">Delete learner?</h2>
              <p className="text-sm text-gray-600">
                This will remove the learner and their enrollments, progress, and quiz submissions. This action cannot be undone.
              </p>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 shadow-sm"
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
