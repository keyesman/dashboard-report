// =============================================================================
// app/dashboard/settings/page.tsx
// Halaman Settings — manage shift, escalation categories, user management
//
// Sections:
// - Shift Config        : admin & leader
// - Escalation Category : admin only
// - User Management     : admin only
// - Sync Data           : admin & leader
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toast";
import {
  Clock, Tag, Users,
  Plus, Trash2, RefreshCw,
  ToggleLeft, ToggleRight, KeyRound,
  Database, CheckCircle, XCircle, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===========================================================================
// TYPES
// ===========================================================================
interface Shift {
  id           : number;
  shiftName    : string;
  startTime    : string;
  endTime      : string;
  priorityOrder: number;
  isActive     : boolean;
}

interface EscalationCategory {
  id      : number;
  name    : string;
  isActive: boolean;
}

interface User {
  id         : number;
  name       : string;
  email      : string;
  role       : string;
  isActive   : boolean;
  lastLoginAt: string | null;
}

interface SyncLog {
  id         : number;
  syncType   : string;
  dateFrom   : string;
  dateTo     : string;
  totalSynced: number;
  status     : string;
  errorMsg   : string | null;
  startedAt  : string;
  finishedAt : string | null;
}

interface SyncResult {
  success    : boolean;
  totalSynced: number;
  errorMsg  ?: string;
}

// ===========================================================================
// TAB CONFIG
// ===========================================================================
const tabs = [
  { id: "shifts",     label: "Shift Config",    icon: Clock      },
  { id: "categories", label: "Escalation", icon: Tag        },
  { id: "users",      label: "User Management", icon: Users      },
  { id: "sync",       label: "Sync Data",       icon: RefreshCw  },
];

// ===========================================================================
// SETTINGS PAGE COMPONENT
// ===========================================================================
export default function SettingsPage() {
  const { data: session } = useSession();
  const router            = useRouter();
  const role = (session?.user as { role?: string })?.role ?? "viewer";

  // Redirect viewer
  useEffect(() => {
    if (role === "viewer") {
      showToast.error("Akses ditolak", "Halaman ini hanya untuk admin & leader.");
      router.push("/dashboard");
    }
  }, [role, router]);

  // Active tab
  const [activeTab, setActiveTab] = useState("shifts");

  // ===========================================================================
  // STATE — Shifts
  // ===========================================================================
  const [shifts,       setShifts]       = useState<Shift[]>([]);
  const [isLoadShift,  setIsLoadShift]  = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newStart,     setNewStart]     = useState("");
  const [newEnd,       setNewEnd]       = useState("");
  const [newPriority,  setNewPriority]  = useState("1");
  const [isAddShift,   setIsAddShift]   = useState(false);

  // ===========================================================================
  // STATE — Escalation Categories
  // ===========================================================================
  const [categories, setCategories] = useState<EscalationCategory[]>([]);
  const [isLoadCat,  setIsLoadCat]  = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isAddCat,   setIsAddCat]   = useState(false);

  // ===========================================================================
  // STATE — Users
  // ===========================================================================
  const [users,        setUsers]        = useState<User[]>([]);
  const [isLoadUser,   setIsLoadUser]   = useState(false);
  const [newName,      setNewName]      = useState("");
  const [newEmail,     setNewEmail]     = useState("");
  const [newUserRole,  setNewUserRole]  = useState("viewer");
  const [newPassword,  setNewPassword]  = useState("");
  const [isAddUser,    setIsAddUser]    = useState(false);
  const [resetUserId,  setResetUserId]  = useState<number | null>(null);
  const [resetPass,    setResetPass]    = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  // ===========================================================================
  // STATE — Sync Data
  // ===========================================================================
  const [syncDateFrom, setSyncDateFrom] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [syncDateTo,   setSyncDateTo]   = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [syncResult,   setSyncResult]   = useState<SyncResult | null>(null);
  const [syncLogs,     setSyncLogs]     = useState<SyncLog[]>([]);
  const [isLoadLogs,   setIsLoadLogs]   = useState(false);

  // ===========================================================================
  // FETCH FUNCTIONS
  // ===========================================================================
  const fetchShifts = useCallback(async () => {
    setIsLoadShift(true);
    try {
      const res  = await fetch("/api/settings/shifts");
      const data = await res.json();
      setShifts(data);
    } catch {
      showToast.error("Gagal memuat shift config.");
    } finally {
      setIsLoadShift(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadCat(true);
    try {
      const res  = await fetch("/api/settings/escalation-categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      showToast.error("Gagal memuat escalation categories.");
    } finally {
      setIsLoadCat(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadUser(true);
    try {
      const res  = await fetch("/api/settings/users");
      const data = await res.json();
      setUsers(data);
    } catch {
      showToast.error("Gagal memuat users.");
    } finally {
      setIsLoadUser(false);
    }
  }, []);

  const fetchSyncLogs = useCallback(async () => {
    setIsLoadLogs(true);
    try {
      const res  = await fetch("/api/sync/logs");
      const data = await res.json();
      setSyncLogs(data);
    } catch {
      showToast.error("Gagal memuat sync logs.");
    } finally {
      setIsLoadLogs(false);
    }
  }, []);

  // Fetch data saat tab berubah
  useEffect(() => {
    if (activeTab === "shifts")     fetchShifts();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "users")      fetchUsers();
    if (activeTab === "sync")       fetchSyncLogs();
  }, [activeTab, fetchShifts, fetchCategories, fetchUsers, fetchSyncLogs]);

  // ===========================================================================
  // SHIFT ACTIONS
  // ===========================================================================
  const handleAddShift = async () => {
    if (!newShiftName || !newStart || !newEnd) {
      showToast.warning("Semua field shift wajib diisi!");
      return;
    }
    setIsAddShift(true);
    try {
      const res = await fetch("/api/settings/shifts", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          shiftName    : newShiftName,
          startTime    : newStart,
          endTime      : newEnd,
          priorityOrder: Number(newPriority),
        }),
      });
      if (res.ok) {
        showToast.success("Shift berhasil ditambahkan!");
        setNewShiftName(""); setNewStart(""); setNewEnd(""); setNewPriority("1");
        fetchShifts();
      } else {
        showToast.error("Gagal menambahkan shift.");
      }
    } finally {
      setIsAddShift(false);
    }
  };

  const handleToggleShift = async (id: number, current: boolean) => {
    const res = await fetch(`/api/settings/shifts/${id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      showToast.success(current ? "Shift dinonaktifkan." : "Shift diaktifkan.");
      fetchShifts();
    } else {
      showToast.error("Gagal update shift.");
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm("Yakin hapus shift ini?")) return;
    const res = await fetch(`/api/settings/shifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast.success("Shift berhasil dihapus!");
      fetchShifts();
    } else {
      showToast.error("Gagal menghapus shift.");
    }
  };

  // ===========================================================================
  // CATEGORY ACTIONS
  // ===========================================================================
  const handleAddCategory = async () => {
    if (!newCatName) {
      showToast.warning("Nama category wajib diisi!");
      return;
    }
    setIsAddCat(true);
    try {
      const res = await fetch("/api/settings/escalation-categories", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ name: newCatName }),
      });
      if (res.ok) {
        showToast.success("Category berhasil ditambahkan!");
        setNewCatName("");
        fetchCategories();
      } else {
        showToast.error("Gagal menambahkan category. Mungkin sudah ada.");
      }
    } finally {
      setIsAddCat(false);
    }
  };

  const handleToggleCategory = async (id: number, current: boolean) => {
    const res = await fetch(
      `/api/settings/escalation-categories/${id}/toggle`,
      { method: "PATCH" }
    );
    if (res.ok) {
      showToast.success(current ? "Category dinonaktifkan." : "Category diaktifkan.");
      fetchCategories();
    } else {
      showToast.error("Gagal update category.");
    }
  };

  // ===========================================================================
  // USER ACTIONS
  // ===========================================================================
  const handleAddUser = async () => {
    if (!newName || !newEmail || !newPassword) {
      showToast.warning("Semua field user wajib diisi!");
      return;
    }
    if (newPassword.length < 8) {
      showToast.warning("Password minimal 8 karakter!");
      return;
    }
    setIsAddUser(true);
    try {
      const res = await fetch("/api/settings/users", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          name    : newName,
          email   : newEmail,
          password: newPassword,
          role    : newUserRole,
        }),
      });
      if (res.ok) {
        showToast.success(`User ${newEmail} berhasil ditambahkan!`);
        setNewName(""); setNewEmail(""); setNewPassword(""); setNewUserRole("viewer");
        fetchUsers();
      } else {
        showToast.error("Gagal menambahkan user. Email mungkin sudah ada.");
      }
    } finally {
      setIsAddUser(false);
    }
  };

  const handleToggleUser = async (id: number, current: boolean) => {
    const currentUserId = Number((session?.user as { id?: string })?.id);
    if (id === currentUserId) {
      showToast.warning("Tidak bisa nonaktifkan akun sendiri!");
      return;
    }
    const res = await fetch(`/api/settings/users/${id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      showToast.success(current ? "User dinonaktifkan." : "User diaktifkan.");
      fetchUsers();
    } else {
      showToast.error("Gagal update user.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetPass) {
      showToast.warning("Password baru wajib diisi!");
      return;
    }
    if (resetPass.length < 8) {
      showToast.warning("Password minimal 8 karakter!");
      return;
    }
    if (resetPass !== resetConfirm) {
      showToast.warning("Password tidak cocok!");
      return;
    }
    const res = await fetch(
      `/api/settings/users/${resetUserId}/reset-password`,
      {
        method : "PATCH",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ newPassword: resetPass }),
      }
    );
    if (res.ok) {
      showToast.success("Password berhasil direset!");
      setResetUserId(null); setResetPass(""); setResetConfirm("");
    } else {
      showToast.error("Gagal reset password.");
    }
  };

  // ===========================================================================
  // SYNC ACTIONS
  // ===========================================================================
  const handleSync = async () => {
    if (!syncDateFrom || !syncDateTo) {
      showToast.warning("Pilih date range dulu!");
      return;
    }
    if (syncDateFrom > syncDateTo) {
      showToast.warning("Tanggal mulai tidak boleh lebih besar dari tanggal selesai!");
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    const toastId = showToast.loading(
      `Syncing data ${syncDateFrom} → ${syncDateTo}...`
    );

    try {
      const res = await fetch("/api/sync", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ dateFrom: syncDateFrom, dateTo: syncDateTo }),
      });

      const data = await res.json();
      setSyncResult(data);
      showToast.dismiss(toastId);

      if (data.success) {
        showToast.success("Sync berhasil!", `${data.totalSynced} ticket berhasil di-sync.`);
      } else {
        showToast.error("Sync gagal!", data.errorMsg ?? "Unknown error");
      }

      fetchSyncLogs();
    } catch {
      showToast.dismiss(toastId);
      showToast.error("Sync gagal!", "Terjadi kesalahan server.");
    } finally {
      setIsSyncing(false);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Settings"
      description="Kelola shift, escalation categories, user, dan sync data"
    >
      {/* TAB NAVIGATION */}
      <div className="flex gap-1 mb-6 bg-[var(--surface-muted)] p-1 rounded-md w-fit">
        {tabs
          .filter((tab) =>
            role === "admin"
              ? true
              : ["shifts", "sync"].includes(tab.id) // Leader: shifts + sync
          )
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium font-body transition-all",
                  activeTab === tab.id
                    ? "bg-[var(--bg-card)] text-primary shadow-subtle"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
      </div>

      {/* ===================================================================
          TAB: SHIFT CONFIG
          =================================================================== */}
      {activeTab === "shifts" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                🕐 Shift Configuration
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchShifts} disabled={isLoadShift}>
                <RefreshCw size={14} className={isLoadShift ? "animate-spin" : ""} />
              </Button>
            </div>

            {isLoadShift ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            ) : shifts.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Belum ada shift.</p>
            ) : (
              <div className="space-y-2">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        shift.isActive ? "bg-success" : "bg-[var(--text-secondary)]"
                      )} />
                      <div>
                        <p className="font-headline font-semibold text-sm text-[var(--text-primary)]">
                          {shift.shiftName}
                        </p>
                        <p className="font-body text-xs text-[var(--text-secondary)]">
                          {shift.startTime} - {shift.endTime} · Priority {shift.priorityOrder}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleShift(shift.id, shift.isActive)}
                        className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                      >
                        {shift.isActive
                          ? <ToggleRight size={20} className="text-primary" />
                          : <ToggleLeft  size={20} />
                        }
                      </button>
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-[var(--text-secondary)] hover:text-error transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-headline font-semibold text-sm text-[var(--text-primary)] mb-4">
              <Plus size={14} className="inline mr-1" />
              Tambah Shift Baru
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Nama Shift"     placeholder="Pagi"  value={newShiftName} onChange={(e) => setNewShiftName(e.target.value)} />
              <Input label="Jam Mulai"      placeholder="05:00" value={newStart}     onChange={(e) => setNewStart(e.target.value)} />
              <Input label="Jam Selesai"    placeholder="13:59" value={newEnd}       onChange={(e) => setNewEnd(e.target.value)} />
              <Input label="Priority Order" type="number" placeholder="1" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddShift} disabled={isAddShift} size="sm">
                {isAddShift ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah Shift
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================
          TAB: ESCALATION CATEGORIES (admin only)
          =================================================================== */}
      {activeTab === "categories" && role === "admin" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                🏷️ Escalation Categories
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchCategories}>
                <RefreshCw size={14} className={isLoadCat ? "animate-spin" : ""} />
              </Button>
            </div>
            {isLoadCat ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Belum ada categories.</p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        cat.isActive ? "bg-success" : "bg-[var(--text-secondary)]"
                      )} />
                      <p className="font-body text-sm text-[var(--text-primary)]">{cat.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={cat.isActive ? "success" : "default"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <button
                        onClick={() => handleToggleCategory(cat.id, cat.isActive)}
                        className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                      >
                        {cat.isActive
                          ? <ToggleRight size={20} className="text-primary" />
                          : <ToggleLeft  size={20} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-headline font-semibold text-sm text-[var(--text-primary)] mb-4">
              <Plus size={14} className="inline mr-1" />
              Tambah Category Baru
            </h3>
            <div className="flex gap-3">
              <Input
                placeholder="Action L2 - New Category"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddCategory} disabled={isAddCat} size="md" className="shrink-0">
                {isAddCat ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================
          TAB: USER MANAGEMENT (admin only)
          =================================================================== */}
      {activeTab === "users" && role === "admin" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                👥 User Management
              </h2>
              <Button variant="ghost" size="sm" onClick={fetchUsers}>
                <RefreshCw size={14} className={isLoadUser ? "animate-spin" : ""} />
              </Button>
            </div>
            {isLoadUser ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Belum ada users.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id}>
                    <div className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-md">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.isActive ? "bg-success" : "bg-[var(--text-secondary)]"
                        )} />
                        <div>
                          <p className="font-headline font-semibold text-sm text-[var(--text-primary)]">
                            {user.name}
                          </p>
                          <p className="font-body text-xs text-[var(--text-secondary)]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          user.role === "admin"  ? "error" :
                          user.role === "leader" ? "info"  : "default"
                        }>
                          {user.role}
                        </Badge>
                        <button
                          onClick={() => setResetUserId(resetUserId === user.id ? null : user.id)}
                          className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleUser(user.id, user.isActive)}
                          className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                        >
                          {user.isActive
                            ? <ToggleRight size={20} className="text-primary" />
                            : <ToggleLeft  size={20} />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Reset Password Form */}
                    {resetUserId === user.id && (
                      <div className="mt-1 p-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md">
                        <p className="font-body text-xs text-[var(--text-secondary)] mb-3">
                          Reset password untuk <strong>{user.name}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Input label="Password Baru"        type="password" placeholder="Min. 8 karakter" value={resetPass}    onChange={(e) => setResetPass(e.target.value)} />
                          <Input label="Konfirmasi Password"  type="password" placeholder="Ulangi password"  value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} />
                        </div>
                        <div className="flex gap-2 mt-3 justify-end">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => { setResetUserId(null); setResetPass(""); setResetConfirm(""); }}
                          >
                            Batal
                          </Button>
                          <Button size="sm" onClick={handleResetPassword}>
                            <KeyRound size={14} />
                            Simpan Password
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-headline font-semibold text-sm text-[var(--text-primary)] mb-4">
              <Plus size={14} className="inline mr-1" />
              Tambah User Baru
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Nama"     placeholder="John Doe"         value={newName}     onChange={(e) => setNewName(e.target.value)} />
              <Input label="Email"    type="email" placeholder="john@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Select
                label="Role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                options={[
                  { value: "viewer", label: "Viewer" },
                  { value: "leader", label: "Leader" },
                  { value: "admin",  label: "Admin"  },
                ]}
              />
              <Input label="Password" type="password" placeholder="Min. 8 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddUser} disabled={isAddUser} size="sm">
                {isAddUser ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah User
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================
          TAB: SYNC DATA (admin & leader)
          =================================================================== */}
      {activeTab === "sync" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-primary" />
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                Sync Data dari Chatwoot
              </h2>
            </div>
            <p className="font-body text-sm text-[var(--text-secondary)] mb-6">
              Fetch dan simpan data ticket dari Chatwoot API ke database lokal.
              Pilih date range yang ingin di-sync.
            </p>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input label="Dari Tanggal"    type="date" value={syncDateFrom} onChange={(e) => setSyncDateFrom(e.target.value)} disabled={isSyncing} />
              <Input label="Sampai Tanggal"  type="date" value={syncDateTo}   onChange={(e) => setSyncDateTo(e.target.value)}   disabled={isSyncing} />
            </div>

            {/* Quick Range Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <p className="font-body text-xs text-[var(--text-secondary)] w-full mb-1">Quick select:</p>
              {[
                { label: "Hari Ini", days: 0  },
                { label: "Kemarin",  days: 1  },
                { label: "7 Hari",   days: 7  },
                { label: "30 Hari",  days: 30 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  disabled={isSyncing}
                  onClick={() => {
                    const to   = new Date();
                    const from = new Date();
                    if (days === 0) {
                      setSyncDateFrom(to.toISOString().split("T")[0]);
                      setSyncDateTo(to.toISOString().split("T")[0]);
                    } else if (days === 1) {
                      from.setDate(from.getDate() - 1);
                      setSyncDateFrom(from.toISOString().split("T")[0]);
                      setSyncDateTo(from.toISOString().split("T")[0]);
                    } else {
                      from.setDate(from.getDate() - days);
                      setSyncDateFrom(from.toISOString().split("T")[0]);
                      setSyncDateTo(to.toISOString().split("T")[0]);
                    }
                  }}
                  className="
                    px-3 py-1.5 rounded-sm text-xs font-medium font-body
                    bg-[var(--surface-muted)] text-[var(--text-secondary)]
                    border border-[var(--border-default)]
                    hover:bg-primary-light hover:text-primary hover:border-primary/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150
                  "
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sync Button */}
            <Button onClick={handleSync} disabled={isSyncing} size="lg" className="w-full gap-2">
              {isSyncing ? (
                <><RefreshCw size={18} className="animate-spin" /> Syncing... Mohon tunggu</>
              ) : (
                <><RefreshCw size={18} /> Mulai Sync</>
              )}
            </Button>

            {/* Loading info */}
            {isSyncing && (
              <div className="mt-4 bg-info/10 border border-info/20 rounded-md px-4 py-3">
                <p className="font-body text-sm text-info">
                  ⏳ Sync sedang berjalan... Proses ini bisa memakan waktu beberapa menit. Jangan tutup halaman ini.
                </p>
              </div>
            )}
          </Card>

          {/* Sync Result */}
          {syncResult && (
            <Card>
              <div className="flex items-center gap-3">
                {syncResult.success ? (
                  <>
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle size={20} className="text-success" />
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-[var(--text-primary)]">Sync Berhasil!</p>
                      <p className="font-body text-sm text-[var(--text-secondary)]">
                        {syncResult.totalSynced} ticket berhasil di-sync ke database.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                      <XCircle size={20} className="text-error" />
                    </div>
                    <div>
                      <p className="font-headline font-semibold text-[var(--text-primary)]">Sync Gagal</p>
                      <p className="font-body text-sm text-error">{syncResult.errorMsg ?? "Unknown error"}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Sync History */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <h3 className="font-headline font-semibold text-[var(--text-primary)]">Riwayat Sync</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchSyncLogs} disabled={isLoadLogs}>
                <RefreshCw size={14} className={isLoadLogs ? "animate-spin" : ""} />
              </Button>
            </div>

            {isLoadLogs ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
            ) : syncLogs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Belum ada riwayat sync.</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface-muted)] rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === "success" && <CheckCircle size={16} className="text-success shrink-0" />}
                      {log.status === "failed"  && <XCircle     size={16} className="text-error shrink-0" />}
                      {log.status === "running" && <RefreshCw   size={16} className="text-info animate-spin shrink-0" />}
                      <div>
                        <p className="font-body text-sm text-[var(--text-primary)]">
                          {log.dateFrom} → {log.dateTo}
                        </p>
                        <p className="font-body text-xs text-[var(--text-secondary)]">
                          {new Date(log.startedAt).toLocaleString("id-ID")} · <span className="capitalize">{log.syncType}</span>
                          {log.status === "failed" && log.errorMsg && (
                            <span className="text-error"> · {log.errorMsg}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {log.status === "success" && (
                        <p className="font-mono text-sm font-semibold text-success">+{log.totalSynced}</p>
                      )}
                      <Badge variant={
                        log.status === "success" ? "success" :
                        log.status === "failed"  ? "error"   : "info"
                      }>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
