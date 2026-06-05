import { z } from "zod";

// ============================================
// CUSTOMER
// ============================================

export const createCustomerSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z
    .string({ message: "Nomor telepon wajib diisi" })
    .min(1, "Nomor telepon wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
  vehicle: z
    .object({
      plateNumber: z.string().min(1).optional().nullable(),
      type: z.string().optional().nullable(),
      brand: z.string().optional().nullable(),
      model: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().min(1, "Nomor telepon wajib diisi").optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
});

// ============================================
// VEHICLE
// ============================================

export const createVehicleSchema = z.object({
  customerId: z.string().uuid("Customer ID tidak valid"),
  plateNumber: z.string().min(1, "Plat nomor wajib diisi"),
  type: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1, "Plat nomor wajib diisi").optional(),
  type: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

// ============================================
// EMPLOYEE
// ============================================

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  position: z.enum(["Mekanik", "Pencuci Mobil"], {
    message: "Posisi harus Mekanik atau Pencuci Mobil",
  }),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  salary: z.number().min(0, "Gaji tidak boleh negatif").optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").optional().nullable(),
  position: z
    .enum(["Mekanik", "Pencuci Mobil"], {
      message: "Posisi harus Mekanik atau Pencuci Mobil",
    })
    .optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  salary: z.number().min(0, "Gaji tidak boleh negatif").optional().nullable(),
  isActive: z.boolean().optional(),
});

// ============================================
// INVENTORY
// ============================================

export const createInventorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  category: z.string().optional().nullable(),
  qty: z.number().int().min(0).optional().default(0),
  unit: z.string().min(1, "Satuan wajib diisi"),
  minStock: z.number().int().min(0).optional().default(0),
  capitalPrice: z.number().min(0).optional().default(0),
  price: z.number().min(0, "Harga wajib diisi"),
  supplierId: z.string().uuid().optional().or(z.literal("")).nullable(),
  rackPosition: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
});

// ============================================
// EXPENSE
// ============================================

export const createExpenseSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(), // ISO date string
});

export const updateExpenseSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi").optional(),
  amount: z.number().positive("Jumlah harus lebih dari 0").optional(),
  description: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

// ============================================
// SUPPLIER
// ============================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi").optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

// ============================================
// WORK ORDER
// ============================================

export const createWorkOrderSchema = z.object({
  vehicleId: z.string().uuid("Kendaraan wajib dipilih"),
  serviceType: z.enum(["SERVIS", "CUCI"], { message: "Tipe layanan wajib dipilih" }),
  serviceIds: z.array(z.string().uuid()).optional(),
  manualServices: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
      })
    )
    .optional(),
  notes: z.string().optional().nullable(),
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
