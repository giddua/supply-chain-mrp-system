import { api, APIError } from "encore.dev/api";
import { demandDB } from "./db";
import * as XLSX from "xlsx";

interface UploadDemandRequest {
  fileData: string; // Base64 encoded Excel file
  fileName: string;
}

interface UploadDemandResponse {
  success: boolean;
  recordsProcessed: number;
  productRecordsProcessed: number;
  message: string;
}

interface DemandRow {
  demand_date: Date;
  product_id: string;
  product_name: string;
  customer_id: string;
  customer_name: string;
  quantity: number;
}

interface ProductRow {
  product_id: string;
  product_name: string;
  cost: number;
  lead_time_months: number;
  ordering_cost: number;
  holding_cost: number;
  eoq: number;
  rop: number;
  ss: number;
  dl: number;
  forecast: number;
  dmd_stdev: number;
}

// Uploads and processes Excel file containing customer demand data.
export const uploadDemandFile = api<UploadDemandRequest, UploadDemandResponse>(
  { expose: true, method: "POST", path: "/demand/upload" },
  async (req) => {
    try {
      // Validate input
      if (!req.fileData || !req.fileName) {
        throw APIError.invalidArgument("File data and file name are required");
      }

      // Decode base64 file data
      let buffer: Buffer;
      try {
        buffer = Buffer.from(req.fileData, "base64");
      } catch (error) {
        throw APIError.invalidArgument("Invalid base64 file data");
      }
      
      // Parse Excel file
      let workbook: any;
      try {
        workbook = XLSX.read(buffer, { type: "buffer" });
      } catch (error) {
        throw APIError.invalidArgument("Invalid Excel file format");
      }
      
      // Check if required sheets exist
      if (!workbook.SheetNames || !workbook.SheetNames.includes("Customer_Demand")) {
        throw APIError.invalidArgument("Excel file must contain a 'Customer_Demand' sheet");
      }
      
      if (!workbook.SheetNames.includes("Products")) {
        throw APIError.invalidArgument("Excel file must contain a 'Products' sheet");
      }
      
      const demandWorksheet = workbook.Sheets["Customer_Demand"];
      const productsWorksheet = workbook.Sheets["Products"];
      
      if (!demandWorksheet) {
        throw APIError.invalidArgument("Customer_Demand sheet is empty or invalid");
      }
      
      if (!productsWorksheet) {
        throw APIError.invalidArgument("Products sheet is empty or invalid");
      }

      // Process Customer_Demand sheet
      let demandJsonData: any[];
      try {
        demandJsonData = XLSX.utils.sheet_to_json(demandWorksheet);
      } catch (error) {
        throw APIError.invalidArgument("Failed to parse Customer_Demand sheet data");
      }
      
      if (!demandJsonData || demandJsonData.length === 0) {
        throw APIError.invalidArgument("Customer_Demand sheet contains no data");
      }
      
      // Process Products sheet
      let productsJsonData: any[];
      try {
        productsJsonData = XLSX.utils.sheet_to_json(productsWorksheet);
      } catch (error) {
        throw APIError.invalidArgument("Failed to parse Products sheet data");
      }
      
      if (!productsJsonData || productsJsonData.length === 0) {
        throw APIError.invalidArgument("Products sheet contains no data");
      }
      
      // Validate and transform demand data
      const demandData: DemandRow[] = [];
      for (let i = 0; i < demandJsonData.length; i++) {
        const row = demandJsonData[i] as any;
        
        try {
          // Parse Excel date (Excel stores dates as numbers)
          let demandDate: Date;
          if (typeof row["Demand Date"] === "number") {
            // Excel date number to JavaScript Date
            const excelDate = new Date((row["Demand Date"] - 25569) * 86400 * 1000);
            // Create a new date with EDT timezone assumption (12:00 AM EDT)
            // EDT is UTC-4, so we need to add 4 hours to get UTC time for 12:00 AM EDT
            demandDate = new Date(excelDate.getFullYear(), excelDate.getMonth(), excelDate.getDate(), 4, 0, 0, 0);
          } else if (typeof row["Demand Date"] === "string") {
            const parsedDate = new Date(row["Demand Date"]);
            if (!isNaN(parsedDate.getTime())) {
              // If string date doesn't have time component, assume 12:00 AM EDT
              if (row["Demand Date"].indexOf(':') === -1) {
                demandDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 4, 0, 0, 0);
              } else {
                demandDate = parsedDate;
              }
            } else {
              throw new Error("Invalid date format");
            }
          } else {
            throw new Error("Invalid date format - must be a date or number");
          }
          
          if (isNaN(demandDate.getTime())) {
            throw new Error("Invalid date value");
          }
          
          const productId = String(row["Product ID"] || "").trim();
          const productName = String(row["Product Name"] || "").trim();
          const customerId = String(row["Customer ID"] || "").trim();
          const customerName = String(row["Customer Name"] || "").trim();
          const quantity = parseFloat(row["Quantity"]);
          
          if (!productId || !productName || !customerId || !customerName) {
            throw new Error("Missing required fields: Product ID, Product Name, Customer ID, or Customer Name");
          }
          
          if (isNaN(quantity) || quantity < 0) {
            throw new Error("Invalid quantity value - must be a non-negative number");
          }
          
          demandData.push({
            demand_date: demandDate,
            product_id: productId,
            product_name: productName,
            customer_id: customerId,
            customer_name: customerName,
            quantity: quantity,
          });
        } catch (error) {
          throw APIError.invalidArgument(
            `Error processing row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      if (demandData.length === 0) {
        throw APIError.invalidArgument("No valid demand data rows found in the Excel file");
      }
      
      // Validate and transform product data
      const productData: ProductRow[] = [];
      for (let i = 0; i < productsJsonData.length; i++) {
        const row = productsJsonData[i] as any;

				//console.log("Raw numeric field values:", {
				//  "Cost": row["Cost"],
				//  "Lead Time Months": row["Lead Time Months"],
				//  "Ordering Cost": row["Ordering Cost"],
				//  "Holding Cost": row["Holding Cost"],
				//  "EOQ": row["EOQ"],
				//  "ROP": row["ROP"],
				//  "SS": row["SS"],
				//  "DL": row["DL"],
				//  "Forecast": row["Forecast"],
				//  "Dmd Stdev": row["Dmd Stdev"]
				//});
        
        try {
          const productId = String(row["Product ID"] || "").trim();
          const productName = String(row["Product Name"] || "").trim();
          const cost = parseFloat(row["Cost"]);
          const leadTimeMonths = parseFloat(row["Lead Time Months"]);
          const orderingCost = parseFloat(row["Ordering Cost"]);
          const holdingCost = parseFloat(row["Holding Cost"]);
          const eoq = parseFloat(row["EOQ"]);
          const rop = parseFloat(row["ROP"]);
          const ss = parseFloat(row["SS"]);
          const dl = parseFloat(row["DL"]);
          const forecast = parseFloat(row["Forecast"]);
          const dmdStdev = parseFloat(row["Dmd Stdev"]);
          
          if (!productId || !productName) {
            throw new Error("Missing required fields: Product ID or Product Name");
          }

					// Check each field individually and provide descriptive error messages
					const numericFields = [
					  { value: cost, name: 'cost' },
					  { value: leadTimeMonths, name: 'leadTimeMonths' },
					  { value: orderingCost, name: 'orderingCost' },
					  { value: holdingCost, name: 'holdingCost' },
					  { value: eoq, name: 'eoq' },
					  { value: rop, name: 'rop' },
					  { value: ss, name: 'ss' },
					  { value: dl, name: 'dl' },
					  { value: forecast, name: 'forecast' },
					  { value: dmdStdev, name: 'dmdStdev' }
					];
					
					const invalidFields = numericFields.filter(field => isNaN(field.value));
					
					if (invalidFields.length > 0) {
					  const fieldNames = invalidFields.map(field => `${field.name} (${field.value})`).join(', ');
					  throw new Error(`Invalid numeric values in product data - Fields with NaN values: ${fieldNames}`);
					}					
          //
          //if (isNaN(cost) || isNaN(leadTimeMonths) || isNaN(orderingCost) || 
          //    isNaN(holdingCost) || isNaN(eoq) || isNaN(rop) || 
          //    isNaN(ss) || isNaN(dl) || isNaN(forecast) || isNaN(dmdStdev)) {
          //  throw new Error("Invalid numeric values in product data");
          //}
          
          productData.push({
            product_id: productId,
            product_name: productName,
            cost: cost,
            lead_time_months: leadTimeMonths,
            ordering_cost: orderingCost,
            holding_cost: holdingCost,
            eoq: eoq,
            rop: rop,
            ss: ss,
            dl: dl,
            forecast: forecast,
            dmd_stdev: dmdStdev,
          });
        } catch (error) {
          throw APIError.invalidArgument(
            `Error processing product row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
      
      if (productData.length === 0) {
        throw APIError.invalidArgument("No valid product data rows found in the Excel file");
      }
      
      // Start transaction to ensure both tables are updated together
      const tx = await demandDB.begin();
      
      try {
        // Clear existing data from all tables
        await tx.exec`DELETE FROM customer_demand`;
        await tx.exec`DELETE FROM modified_demand_data`;
        await tx.exec`DELETE FROM product_data`;
				await tx.exec`DELETE FROM forecast_data`;
        
        // Batch insert for better performance
        const batchSize = 1000;
        let recordsProcessed = 0;
        let productRecordsProcessed = 0;
        
        // Insert demand data
        for (let i = 0; i < demandData.length; i += batchSize) {
          const batch = demandData.slice(i, i + batchSize);
          
          for (const row of batch) {
            // Insert into original table
            await tx.exec`
              INSERT INTO customer_demand (demand_date, product_id, product_name, customer_id, customer_name, quantity)
              VALUES (${row.demand_date}, ${row.product_id}, ${row.product_name}, ${row.customer_id}, ${row.customer_name}, ${row.quantity})
            `;
            
            // Insert into modified table (working copy)
            await tx.exec`
              INSERT INTO modified_demand_data (demand_date, product_id, product_name, customer_id, customer_name, quantity)
              VALUES (${row.demand_date}, ${row.product_id}, ${row.product_name}, ${row.customer_id}, ${row.customer_name}, ${row.quantity})
            `;
            
            recordsProcessed++;
          }
        }
        
        // Insert product data
        for (let i = 0; i < productData.length; i += batchSize) {
          const batch = productData.slice(i, i + batchSize);
          
          for (const row of batch) {
            await tx.exec`
              INSERT INTO product_data (product_id, product_name, cost, lead_time_months, ordering_cost, holding_cost, eoq, rop, ss, dl, forecast, dmd_stdev)
              VALUES (${row.product_id}, ${row.product_name}, ${row.cost}, ${row.lead_time_months}, ${row.ordering_cost}, ${row.holding_cost}, ${row.eoq}, ${row.rop}, ${row.ss}, ${row.dl}, ${row.forecast}, ${row.dmd_stdev})
            `;
            
            productRecordsProcessed++;
          }
        }
        // insert new forecast data after user updates to the demand data
        console.log("Inserting Forecast records");
        const forecastInsertSql = "insert into forecast_data (demand_period, product_id, product_name, quantity) select date_trunc('month', demand_date) AS demand_period, product_id, product_name, SUM(quantity) AS quantity FROM modified_demand_data GROUP BY date_trunc('month', demand_date), product_id, product_name "
       
        await tx.rawExec(forecastInsertSql);
        
        await tx.commit();
        
        return {
          success: true,
          recordsProcessed,
          productRecordsProcessed,
          message: `Successfully processed ${recordsProcessed} demand records and ${productRecordsProcessed} product records`,
        };
      } catch (error) {
        await tx.rollback();
        throw APIError.internal("Failed to save data to database", error as Error);
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Log the error for debugging
      console.error("Excel file processing error:", error);
      
      throw APIError.internal("Failed to process Excel file", error as Error);
    }
  }
);
