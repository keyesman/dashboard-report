// =============================================================================
// lib/queries/settings.ts
// Database query functions untuk halaman Settings
//
// Functions:
// - Shift Config    : getShifts, addShift, toggleShift, deleteShift
// - Escalation Cat  : getEscalationCategories, addCategory, toggleCategory
// - User Management : getUsers, addUser, toggleUser, resetPassword
// =============================================================================

import prisma        from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// =============================================================================
// SHIFT CONFIG
// =============================================================================

// Ambil semua shift config
export async function getShifts() {
  return prisma.shiftConfig.findMany({
    orderBy: { priorityOrder: "asc" },
  });
}

// Tambah shift baru
export async function addShift(data: {
  shiftName    : string;
  startTime    : string;
  endTime      : string;
  priorityOrder: number;
}) {
  try {
    await prisma.shiftConfig.create({
      data: { ...data, isActive: true },
    });
    return true;
  } catch (error) {
    console.error("Error adding shift:", error);
    return false;
  }
}

// Toggle aktif/nonaktif shift
export async function toggleShift(id: number, currentStatus: boolean) {
  try {
    await prisma.shiftConfig.update({
      where: { id },
      data : { isActive: !currentStatus },
    });
    return true;
  } catch (error) {
    console.error("Error toggling shift:", error);
    return false;
  }
}

// Hapus shift
export async function deleteShift(id: number) {
  try {
    await prisma.shiftConfig.delete({ where: { id } });
    return true;
  } catch (error) {
    console.error("Error deleting shift:", error);
    return false;
  }
}

// =============================================================================
// ESCALATION CATEGORIES
// =============================================================================

// Ambil semua escalation categories
export async function getEscalationCategories(activeOnly = false) {
  return prisma.escalationCategory.findMany({
    where  : activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
    select : {
      id       : true,
      name     : true,
      isActive : true,
      createdAt: true,
      updatedAt: true,
    },
  });
}


// Tambah escalation category baru
export async function addEscalationCategory(name: string) {
  try {
    await prisma.escalationCategory.create({
      data: { name, isActive: true },
    });
    return true;
  } catch (error) {
    console.error("Error adding category:", error);
    return false;
  }
}

// Toggle aktif/nonaktif category
export async function toggleEscalationCategory(
  id: number,
  currentStatus: boolean
) {
  try {
    await prisma.escalationCategory.update({
      where: { id },
      data : { isActive: !currentStatus },
    });
    return true;
  } catch (error) {
    console.error("Error toggling category:", error);
    return false;
  }
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

// Ambil semua users (tanpa password hash)
export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id         : true,
      name       : true,
      email      : true,
      role       : true,
      isActive   : true,
      lastLoginAt: true,
      createdAt  : true,
    },
    orderBy: { createdAt: "asc" },
  });
}

// Tambah user baru
export async function addUser(data: {
  name    : string;
  email   : string;
  password: string;
  role    : string;
}) {
  try {
    // Hash password sebelum simpan ke DB
    const passwordHash = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        name        : data.name,
        email       : data.email,
        passwordHash,
        role        : data.role,
        isActive    : true,
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding user:", error);
    return false;
  }
}

// Toggle aktif/nonaktif user
export async function toggleUser(id: number, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data : { isActive: !currentStatus },
    });
    return true;
  } catch (error) {
    console.error("Error toggling user:", error);
    return false;
  }
}

// Reset password user
export async function resetPassword(id: number, newPassword: string) {
  try {
    // Hash password baru sebelum update
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data : { passwordHash },
    });
    return true;
  } catch (error) {
    console.error("Error resetting password:", error);
    return false;
  }
}
