import { z } from "zod";

// ============================================
// CUSTOMER
// ============================================

export const createCustomerSchema = z.object({
  name: z.string().optional(),
  phone: z
    .string({ message: "Nomor telepon wajib diisi" })
    .min(1, "Nomor telepon wajib diisi"),
  email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),
  vehicle: z
    .object({
      plateNumber: z.string().optional().or(z.literal("")),
      type: z.string().optional().or(z.literal("")),
      brand: z.string().optional().or(z.literal("")),
      model: z.string().optional().or(z.literal("")),
      color: z.string().optional().or(z.literal("")),
    })
    .optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),
});

// ============================================
// VEHICLE
// ============================================

export const createVehicleSchema = z.object({
  customerId: z.string().uuid("Customer ID tidak valid"),
  plateNumber: z.string().min(1, "Plat nomor wajib diisi"),
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});

export const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plat nomor wajib diisi").optional(),
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
});

// ============================================
// EMPLOYEE
// ============================================

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  position: z.enum(["Mekanik", "Pencuci Mobil"], {
    message: "Posisi harus Mekanik atau Pencuci Mobil",
  }),
  email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),
  phone: z.string().optional(),
  salary: z.number().min(0, "Gaji tidak boleh negatif").optional(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  position: z
    .enum(["Mekanik", "Pencuci Mobil"], {
      message: "Posisi harus Mekanik atau Pencuci Mobil",
    })
    .optional(),
  email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),
  phone: z.string().optional(),
  salary: z.number().min(0, "Gaji tidak boleh negatif").optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// INVENTORY
// ============================================

export const createInventorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  category: z.string().optional(),
  qty: z.number().int().min(0).optional().default(0),
  unit: z.string().min(1, "Satuan wajib diisi"),
  minStock: z.number().int().min(0).optional().default(0),
  capitalPrice: z.number().min(0).optional().default(0),
  price: z.number().min(0, "Harga wajib diisi"),
  supplierId: z.string().uuid("Supplier wajib dipilih"),
  rackPosition: z.string().nullable().optional(),
  paymentMethod: z.string().optional(),
});

export const updateInventorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional(),
  category: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi").optional(),
  minStock: z.number().int().min(0).optional(),
  capitalPrice: z.number().min(0).optional(),
  price: z.number().min(0, "Harga wajib diisi").optional(),
  supplierId: z.string().uuid("Supplier wajib dipilih").optional(),
  rackPosition: z.string().nullable().optional(),
});

export const stockAdjustmentSchema = z.object({
  qty: z.number().int().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["IN", "OUT"], { message: "Tipe harus IN atau OUT" }),
  notes: z.string().optional(),
  recordExpense: z.boolean().optional(),
});

// ============================================
// EXPENSE
// ============================================

export const createExpenseSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().optional(),
  date: z.string().optional(), // ISO date string
});

export const updateExpenseSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi").optional(),
  amount: z.number().positive("Jumlah harus lebih dari 0").optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

// ============================================
// SUPPLIER
// ============================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ============================================
// WORK ORDER
// ============================================

export const createWorkOrderSchema = z.object({
  vehicleId: z.string().uuid("Kendaraan wajib dipilih"),
  serviceType: z.enum(["SERVIS", "CUCI"], { message: "Tipe layanan wajib dipilih" }),
  serviceIds: z.array(z.string().uuid()).optional(),
  estimatedCompletionAt: z.string().optional(),
  manualServices: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
      })
    )
    .optional(),
  notes: z.string().nullable().optional(),
});

const employeeAssignmentSchema = z.object({
  targetType: z.enum(["service", "part", "history"]),
  targetId: z.string(),
  employeeIds: z.array(z.string()),
});

export const updateWorkOrderSchema = z.object({
  status: z.enum(["ANTRI", "PROSES", "SELESAI"]).optional(),
  employeeAssignments: z.array(employeeAssignmentSchema).optional(),
  estimatedCompletionAt: z.string().nullable().optional(),
});

// ============================================
// TRANSACTION (Cashier Payment)
// ============================================

const jasaItemSchema = z.object({
  tempId: z.string(),
  name: z.string(),
  price: z.number().min(0),
  employeeIds: z.array(z.string()),
  serviceId: z.string().optional(), // Used for commission matching
});

const partItemSchema = z.object({
  tempId: z.string(),
  inventoryId: z.string(),
  name: z.string().optional(),
  price: z.number().min(0),
  qty: z.number().int().positive("Qty harus minimal 1"),
  employeeIds: z.array(z.string()),
});

export const createTransactionSchema = z.object({
  paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS"], {
    message: "Metode pembayaran wajib dipilih",
  }),
  jasaItems: z.array(jasaItemSchema).optional().default([]),
  partItems: z.array(partItemSchema).optional().default([]),
});

// ============================================
// MONTHLY CLOSING
// ============================================

export const monthlyClosingQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

// ============================================
// TRACKING
// ============================================

export const trackingQuerySchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
  phone: z.string().length(4, "Masukkan 4 digit terakhir nomor HP"),
});

// ============================================
// HELPER: Parse and format Zod errors
// ============================================

export function parseZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(", ");
}
