import { api, APIError } from "encore.dev/api";
import { demandDB } from "./db";

interface UpdateModifiedDemandRequest {
  id: number;
  demandDate: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  quantity: number;
}

interface UpdateModifiedDemandResponse {
  success: boolean;
  message: string;
}

// Updates a single modified demand record.
export const updateModifiedDemand = api<UpdateModifiedDemandRequest, UpdateModifiedDemandResponse>(
  { expose: true, method: "PUT", path: "/demand/modified/:id" },
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
    
    // Check if record exists
    const existingRecord = await demandDB.queryRow<{ id: number }>`
      SELECT id FROM modified_demand_data WHERE id = ${req.id}
    `;
    
    if (!existingRecord) {
      throw APIError.notFound("Demand record not found");
    }
    
    // Update the record
    await demandDB.exec`
      UPDATE modified_demand_data 
      SET 
        demand_date = ${demandDate},
        product_id = ${req.productId.trim()},
        product_name = ${req.productName.trim()},
        customer_id = ${req.customerId.trim()},
        customer_name = ${req.customerName.trim()},
        quantity = ${req.quantity},
        modified_at = NOW()
      WHERE id = ${req.id}
    `;
    
    return {
      success: true,
      message: "Demand record updated successfully",
    };
  }
);
