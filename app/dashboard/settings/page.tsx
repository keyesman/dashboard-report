// =============================================================================
// app/dashboard/settings/page.tsx
// Halaman Settings — manage shift, escalation categories, user management
//
// Sections:
// - Shift Config        : admin & leader
// - Escalation Category : admin only
// - User Management     : admin only
//
// Features:
// - Tab navigation per section
// - CRUD operations (add, toggle, delete)
// - Role-based visibility
// - Dark mode support
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
  ToggleLeft, ToggleRight, KeyRound
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

// ===========================================================================
// TAB CONFIG
// ===========================================================================
const tabs = [
  { id: "shifts",     label: "Shift Config",    icon: Clock  },
  { id: "categories", label: "Esc. Categories", icon: Tag    },
  { id: "users",      label: "User Management", icon: Users  },
];

// ===========================================================================
// SETTINGS PAGE COMPONENT
// ===========================================================================
export default function SettingsPage() {
  const { data: session } = useSession();
  const router            = useRouter();
  const role = (session?.user as { role?: string })?.role ?? "viewer";

  // Redirect viewer — tidak punya akses ke settings
  useEffect(() => {
    if (role === "viewer") {
      showToast.error("Akses ditolak", "Halaman ini hanya untuk admin & leader.");
      router.push("/dashboard");
    }
  }, [role, router]);

  // Active tab state — default ke shifts
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
  const [categories,   setCategories]   = useState<EscalationCategory[]>([]);
  const [isLoadCat,    setIsLoadCat]    = useState(false);
  const [newCatName,   setNewCatName]   = useState("");
  const [isAddCat,     setIsAddCat]     = useState(false);

  // ===========================================================================
  // STATE — Users
  // ===========================================================================
  const [users,          setUsers]          = useState<User[]>([]);
  const [isLoadUser,     setIsLoadUser]     = useState(false);
  const [newName,        setNewName]        = useState("");
  const [newEmail,       setNewEmail]       = useState("");
  const [newUserRole,    setNewUserRole]    = useState("viewer");
  const [newPassword,    setNewPassword]    = useState("");
  const [isAddUser,      setIsAddUser]      = useState(false);
  const [resetUserId,    setResetUserId]    = useState<number | null>(null);
  const [resetPass,      setResetPass]      = useState("");
  const [resetConfirm,   setResetConfirm]   = useState("");

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

  // Fetch data saat tab berubah
  useEffect(() => {
    if (activeTab === "shifts")     fetchShifts();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "users")      fetchUsers();
  }, [activeTab, fetchShifts, fetchCategories, fetchUsers]);

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
    const res = await fetch(`/api/settings/escalation-categories/${id}/toggle`, {
      method: "PATCH",
    });
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
    const res = await fetch(`/api/settings/users/${resetUserId}/reset-password`, {
      method : "PATCH",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ newPassword: resetPass }),
    });
    if (res.ok) {
      showToast.success("Password berhasil direset!");
      setResetUserId(null); setResetPass(""); setResetConfirm("");
    } else {
      showToast.error("Gagal reset password.");
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <DashboardLayout
      title="Settings"
      description="Kelola shift, escalation categories, dan user"
    >
      {/* =================================================================
          TAB NAVIGATION
          ================================================================= */}
      <div className="flex gap-1 mb-6 bg-[var(--surface-muted)] p-1 rounded-md w-fit">
        {tabs
          // Leader hanya bisa akses shift tab
          .filter((tab) => role === "admin" || tab.id === "shifts")
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

      {/* =================================================================
          TAB: SHIFT CONFIG
          ================================================================= */}
      {activeTab === "shifts" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-semibold text-[var(--text-primary)]">
                🕐 Shift Configuration
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchShifts}
                disabled={isLoadShift}
              >
                <RefreshCw size={14} className={isLoadShift ? "animate-spin" : ""} />
              </Button>
            </div>

            {/* List Shifts */}
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
                      {/* Status indicator */}
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
                      {/* Toggle button */}
                      <button
                        onClick={() => handleToggleShift(shift.id, shift.isActive)}
                        className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                        title={shift.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {shift.isActive
                          ? <ToggleRight size={20} className="text-primary" />
                          : <ToggleLeft  size={20} />
                        }
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-[var(--text-secondary)] hover:text-error transition-colors"
                        title="Hapus shift"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Form Tambah Shift */}
          <Card>
            <h3 className="font-headline font-semibold text-sm text-[var(--text-primary)] mb-4">
              <Plus size={14} className="inline mr-1" />
              Tambah Shift Baru
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Nama Shift"
                placeholder="Pagi"
                value={newShiftName}
                onChange={(e) => setNewShiftName(e.target.value)}
              />
              <Input
                label="Jam Mulai"
                placeholder="05:00"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
              <Input
                label="Jam Selesai"
                placeholder="13:59"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
              <Input
                label="Priority Order"
                type="number"
                placeholder="1"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAddShift}
                disabled={isAddShift}
                size="sm"
              >
                {isAddShift ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah Shift
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================
          TAB: ESCALATION CATEGORIES (admin only)
          ================================================================= */}
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
                      <p className="font-body text-sm text-[var(--text-primary)]">
                        {cat.name}
                      </p>
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

          {/* Form Tambah Category */}
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
              <Button
                onClick={handleAddCategory}
                disabled={isAddCat}
                size="md"
                className="shrink-0 mt-0"
              >
                {isAddCat ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Tambah
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================
          TAB: USER MANAGEMENT (admin only)
          ================================================================= */}
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
                          user.role === "admin"  ? "error"   :
                          user.role === "leader" ? "info"    : "default"
                        }>
                          {user.role}
                        </Badge>
                        {/* Reset password */}
                        <button
                          onClick={() => setResetUserId(
                            resetUserId === user.id ? null : user.id
                          )}
                          className="text-[var(--text-secondary)] hover:text-primary transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound size={16} />
                        </button>
                        {/* Toggle user */}
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

                    {/* Reset Password Form — inline expand */}
                    {resetUserId === user.id && (
                      <div className="mt-1 p-3 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-md">
                        <p className="font-body text-xs text-[var(--text-secondary)] mb-3">
                          Reset password untuk <strong>{user.name}</strong>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Password Baru"
                            type="password"
                            placeholder="Min. 8 karakter"
                            value={resetPass}
                            onChange={(e) => setResetPass(e.target.value)}
                          />
                          <Input
                            label="Konfirmasi Password"
                            type="password"
                            placeholder="Ulangi password"
                            value={resetConfirm}
                            onChange={(e) => setResetConfirm(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2 mt-3 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetUserId(null);
                              setResetPass("");
                              setResetConfirm("");
                            }}
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

          {/* Form Tambah User */}
          <Card>
            <h3 className="font-headline font-semibold text-sm text-[var(--text-primary)] mb-4">
              <Plus size={14} className="inline mr-1" />
              Tambah User Baru
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Nama"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
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
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleAddUser}
                disabled={isAddUser}
                size="sm"
              >
                {isAddUser
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <Plus size={14} />
                }
                Tambah User
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
