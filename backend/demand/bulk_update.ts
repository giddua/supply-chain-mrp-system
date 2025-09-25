import { api, APIError } from "encore.dev/api";
import { demandDB } from "./db";

interface BulkUpdateRequest {
  monthYear?: string; // Format: YYYY-MM
  productId?: string;
  customerId?: string;
  percentage: number;
  description: string;
}

interface BulkUpdateResponse {
  success: boolean;
  message: string;
  recordsAffected: number;
  sqlQuery: string;
}

// Performs bulk update on modified demand data based on filters and percentage change.
export const bulkUpdateDemand = api<BulkUpdateRequest, BulkUpdateResponse>(
  { expose: true, method: "POST", path: "/demand/bulk-update" },
  async (req) => {
    // Validate percentage
    if (req.percentage === 0) {
      throw APIError.invalidArgument("Percentage cannot be zero");
    }

    if (req.percentage < -100) {
      throw APIError.invalidArgument("Percentage cannot be less than -100%");
    }

    // Calculate multiplier
    const multiplier = 1 + (req.percentage / 100);

    let recordsToUpdate = 0;
    let displaySql = "";
    let countSql = "";
    let updateSql = "";

    try {
      // Execute the update in a transaction
      const tx = await demandDB.begin();
      
      try {
        let countResult;

        // Handle different filter combinations using hard-coded SQL
        if (req.monthYear && req.productId && req.customerId) {
          const [year, month] = req.monthYear.split('-').map(Number);
          
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND product_id = '${req.productId}' AND customer_id = '${req.customerId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }

          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND product_id = '${req.productId}' AND customer_id = '${req.customerId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);
          
        } else if (req.monthYear && req.productId) {
          const [year, month] = req.monthYear.split('-').map(Number);
          
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND product_id = '${req.productId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND product_id = '${req.productId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);

        } else if (req.monthYear && req.customerId) {
          const [year, month] = req.monthYear.split('-').map(Number);
          
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND customer_id = '${req.customerId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month} AND customer_id = '${req.customerId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);

        } else if (req.productId && req.customerId) {
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE product_id = '${req.productId}' AND customer_id = '${req.customerId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE product_id = '${req.productId}' AND customer_id = '${req.customerId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);

        } else if (req.monthYear) {
          const [year, month] = req.monthYear.split('-').map(Number);
          
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month}`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE EXTRACT(YEAR FROM demand_date) = ${year} AND EXTRACT(MONTH FROM demand_date) = ${month}`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);
          
        } else if (req.productId) {
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE product_id = '${req.productId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE product_id = '${req.productId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);
          
        } else if (req.customerId) {
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data WHERE customer_id = '${req.customerId}'`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records match the specified criteria");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW() WHERE customer_id = '${req.customerId}'`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);
          
        } else {
          // No filters - update all records
          countSql = `SELECT COUNT(*) as count FROM modified_demand_data`;
          countResult = await tx.rawQueryRow<{ count: number }>(countSql);
          
          recordsToUpdate = countResult?.count || 0;
          
          if (recordsToUpdate === 0) {
            await tx.rollback();
            throw APIError.notFound("No records found in modified_demand_data table");
          }
          
          updateSql = `UPDATE modified_demand_data SET quantity = quantity * ${multiplier}, modified_at = NOW()`;
          displaySql = updateSql;
          console.log("Executing update query:", displaySql);
          await tx.rawExec(updateSql);
        }
        
        // Log the update operation with hard-coded SQL
        console.log("Inserting history record");
        const escapedDescription = req.description.replace(/'/g, "''"); // Escape single quotes
        const historySql = `INSERT INTO demand_update_history (month_year, product_id, customer_id, percentage, description, records_affected, sql_query, created_at) VALUES (${req.monthYear ? `'${req.monthYear}'` : 'NULL'}, ${req.productId ? `'${req.productId}'` : 'NULL'}, ${req.customerId ? `'${req.customerId}'` : 'NULL'}, ${req.percentage}, '${escapedDescription}', ${recordsToUpdate}, '${displaySql.replace(/'/g, "''")}', NOW())`;
        
        await tx.rawExec(historySql);

        // Delete forecast data before updating
        console.log("Deleting Forecast records");
        const forecastDeleteSql = `delete from forecast_data`;
        
        await tx.rawExec(forecastDeleteSql);

        // insert new forecast data after user updates to the demand data
        console.log("Inserting Forecast records");
        const forecastInsertSql = "insert into forecast_data (demand_period, product_id, product_name, quantity) select date_trunc('month', demand_date) AS demand_period, product_id, product_name, SUM(quantity) AS quantity FROM modified_demand_data GROUP BY date_trunc('month', demand_date), product_id, product_name "

        
        await tx.rawExec(forecastInsertSql);
				
				await tx.commit();
        
        const successResponse = {
          success: true,
          message: `Successfully updated ${recordsToUpdate} records`,
          recordsAffected: recordsToUpdate,
          sqlQuery: displaySql,
        };
        
        console.log("Service call successful. Returning:", successResponse);
        return successResponse;

      } catch (error) {
        await tx.rollback();
        throw error;
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      console.error("Bulk update error:", error);
      throw APIError.internal("Failed to execute bulk update", error as Error);
    }
  }
);