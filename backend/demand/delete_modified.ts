import { api, APIError } from "encore.dev/api";
import { demandDB } from "./db";

interface DeleteModifiedDemandRequest {
  id: number;
}

interface DeleteModifiedDemandResponse {
  success: boolean;
  message: string;
}

// Deletes a modified demand record.
export const deleteModifiedDemand = api<DeleteModifiedDemandRequest, DeleteModifiedDemandResponse>(
  { expose: true, method: "DELETE", path: "/demand/modified/:id" },
  async (req) => {
    // Check if record exists
    const existingRecord = await demandDB.queryRow<{ id: number }>`
      SELECT id FROM modified_demand_data WHERE id = ${req.id}
    `;
    
    if (!existingRecord) {
      throw APIError.notFound("Demand record not found");
    }
    
    // Delete the record
    await demandDB.exec`
      DELETE FROM modified_demand_data WHERE id = ${req.id}
    `;
    
    return {
      success: true,
      message: "Demand record deleted successfully",
    };
  }
);
