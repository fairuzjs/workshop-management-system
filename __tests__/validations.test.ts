import { describe, it, expect } from "vitest";
import {
  createVehicleSchema,
  updateVehicleSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createExpenseSchema,
  updateExpenseSchema,
  createInventorySchema,
  stockAdjustmentSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createCustomerSchema,
  updateCustomerSchema,
} from "@/lib/validations";

describe("Vehicle Validation", () => {
  describe("createVehicleSchema", () => {
    it("accepts valid vehicle data", () => {
      const result = createVehicleSchema.safeParse({
        customerId: "550e8400-e29b-41d4-a716-446655440000",
        plateNumber: "B1234ABC",
        brand: "Toyota",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing customerId", () => {
      const result = createVehicleSchema.safeParse({
        plateNumber: "B1234ABC",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing plateNumber", () => {
      const result = createVehicleSchema.safeParse({
        customerId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateVehicleSchema", () => {
    it("accepts partial update", () => {
      const result = updateVehicleSchema.safeParse({ brand: "Honda" });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (no changes)", () => {
      const result = updateVehicleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe("Work Order Validation", () => {
  describe("createWorkOrderSchema", () => {
    it("accepts valid CUCI work order", () => {
      const result = createWorkOrderSchema.safeParse({
        vehicleId: "550e8400-e29b-41d4-a716-446655440000",
        serviceType: "CUCI",
        serviceIds: ["550e8400-e29b-41d4-a716-446655440001"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid SERVIS work order", () => {
      const result = createWorkOrderSchema.safeParse({
        vehicleId: "550e8400-e29b-41d4-a716-446655440000",
        serviceType: "SERVIS",
        manualServices: [{ name: "Ganti Oli", price: 50000 }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid serviceType", () => {
      const result = createWorkOrderSchema.safeParse({
        vehicleId: "550e8400-e29b-41d4-a716-446655440000",
        serviceType: "INVALID",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID vehicleId", () => {
      const result = createWorkOrderSchema.safeParse({
        vehicleId: "not-a-uuid",
        serviceType: "CUCI",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkOrderSchema", () => {
    it("accepts valid status transition", () => {
      const result = updateWorkOrderSchema.safeParse({ status: "PROSES" });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = updateWorkOrderSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("accepts valid employee assignments", () => {
      const result = updateWorkOrderSchema.safeParse({
        employeeAssignments: [
          { targetType: "service", targetId: "abc", employeeIds: ["emp1"] },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("Inventory Validation", () => {
  describe("createInventorySchema", () => {
    it("accepts valid inventory data", () => {
      const result = createInventorySchema.safeParse({
        name: "Oli Mesin",
        unit: "botol",
        price: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative price", () => {
      const result = createInventorySchema.safeParse({
        name: "Oli",
        unit: "botol",
        price: -1000,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createInventorySchema.safeParse({
        name: "",
        unit: "pcs",
        price: 5000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("stockAdjustmentSchema", () => {
    it("accepts valid stock IN", () => {
      const result = stockAdjustmentSchema.safeParse({
        qty: 10,
        type: "IN",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid stock OUT", () => {
      const result = stockAdjustmentSchema.safeParse({
        qty: 5,
        type: "OUT",
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero qty", () => {
      const result = stockAdjustmentSchema.safeParse({
        qty: 0,
        type: "IN",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative qty", () => {
      const result = stockAdjustmentSchema.safeParse({
        qty: -5,
        type: "IN",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid type", () => {
      const result = stockAdjustmentSchema.safeParse({
        qty: 10,
        type: "TRANSFER",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Employee Validation", () => {
  describe("createEmployeeSchema", () => {
    it("accepts valid employee data", () => {
      const result = createEmployeeSchema.safeParse({
        name: "Budi",
        position: "Mekanik",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid position", () => {
      const result = createEmployeeSchema.safeParse({
        name: "Budi",
        position: "Manager",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateEmployeeSchema", () => {
    it("accepts partial update", () => {
      const result = updateEmployeeSchema.safeParse({ salary: 5000000 });
      expect(result.success).toBe(true);
    });

    it("rejects negative salary", () => {
      const result = updateEmployeeSchema.safeParse({ salary: -100 });
      expect(result.success).toBe(false);
    });
  });
});

describe("Expense Validation", () => {
  describe("createExpenseSchema", () => {
    it("accepts valid expense", () => {
      const result = createExpenseSchema.safeParse({
        category: "Pembelian Stok",
        amount: 500000,
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero amount", () => {
      const result = createExpenseSchema.safeParse({
        category: "Pembelian",
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Customer Validation", () => {
  describe("createCustomerSchema", () => {
    it("accepts valid customer with phone", () => {
      const result = createCustomerSchema.safeParse({
        phone: "081234567890",
      });
      expect(result.success).toBe(true);
    });

    it("accepts customer with vehicle", () => {
      const result = createCustomerSchema.safeParse({
        phone: "081234567890",
        vehicle: { plateNumber: "B1234ABC" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing phone", () => {
      const result = createCustomerSchema.safeParse({
        name: "Budi",
      });
      expect(result.success).toBe(false);
    });
  });
});
