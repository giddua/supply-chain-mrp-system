import { api, APIError } from "encore.dev/api";
import { demandDB } from "./db";

interface CreateModifiedDemandRequest {
  demandDate: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  quantity: number;
}

interface CreateModifiedDemandResponse {
  id: number;
  success: boolean;
  message: string;
}

// Creates a new modified demand record.
export const createModifiedDemand = api<CreateModifiedDemandRequest, CreateModifiedDemandResponse>(
  { expose: true, method: "POST", path: "/demand/modified" },
  async (req) => {
    // Validate input
    if (!req.productId?.trim() || !req.productName?.trim() || !req.customerId?.trim() || !req.customerName?.trim()) {
      throw APIError.invalidArgument("All fields are required and cannot be empty");
    }
    
    if (req.quantity < 0) {
      throw APIError.invalidArgument("Quantity cannot be negative");
    }
    
    // Parse and validate date
    const demandDate = new Date(req.demandDate);
    if (isNaN(demandDate.getTime())) {
      throw APIError.invalidArgument("Invalid date format");
    }
    
    // Insert the new record
    const result = await demandDB.queryRow<{ id: number }>`
      INSERT INTO modified_demand_data (demand_date, product_id, product_name, customer_id, customer_name, quantity)
      VALUES (${demandDate}, ${req.productId.trim()}, ${req.productName.trim()}, ${req.customerId.trim()}, ${req.customerName.trim()}, ${req.quantity})
      RETURNING id
    `;
    
    if (!result) {
      throw APIError.internal("Failed to create demand record");
    }
    
    return {
      id: result.id,
      success: true,
      message: "Demand record created successfully",
    };
  }
);
