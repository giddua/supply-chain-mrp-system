import { api } from "encore.dev/api";
import { demandDB } from "./db";

// Huber's M-estimator for robust location and scale estimation
function huberEstimator(data: number[], k: number = 1.345): { location: number; scale: number } {
  if (data.length === 0) {
    return { location: 0, scale: 0 };
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Initial estimates using median and MAD
  let location = median(sortedData);
  let scale = medianAbsoluteDeviation(sortedData, location);
  
  // If scale is 0, use a small default value
  if (scale === 0) {
    scale = 0.001;
  }

  // Iterative refinement
  const maxIterations = 100;
  const tolerance = 1e-6;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const oldLocation = location;
    const oldScale = scale;
    
    // Calculate weights using Huber's psi function
    const weights = data.map(x => {
      const standardized = Math.abs((x - location) / scale);
      return standardized <= k ? 1 : k / standardized;
    });
    
    // Update location estimate
    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    location = weights.reduce((sum, w, i) => sum + w * data[i], 0) / weightSum;
    
    // Update scale estimate
    const residuals = data.map(x => Math.abs(x - location));
    const weightedResiduals = residuals.map((r, i) => weights[i] * r);
    const weightedSum = weightedResiduals.reduce((sum, wr) => sum + wr, 0);
    scale = weightedSum / weightSum;
    
    // Check convergence
    if (Math.abs(location - oldLocation) < tolerance && Math.abs(scale - oldScale) < tolerance) {
      break;
    }
  }
  
  return { location, scale };
}

function median(sortedData: number[]): number {
  const n = sortedData.length;
  if (n % 2 === 0) {
    return (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2;
  } else {
    return sortedData[Math.floor(n / 2)];
  }
}

function medianAbsoluteDeviation(sortedData: number[], center: number): number {
  const deviations = sortedData.map(x => Math.abs(x - center)).sort((a, b) => a - b);
  return median(deviations) * 1.4826; // Scale factor for normal distribution consistency
}

interface ForecastResult {
  productId: string;
  productName: string;
  forecast: number;
  dmdStdev: number;
}

interface ProcessForecastResponse {
  results: ForecastResult[];
}

export const processForecast = api(
  { method: "POST", path: "/forecast/process", expose: true },
  async (): Promise<ProcessForecastResponse> => {
    // Step 1: Get distinct product_ids
    const productSql = `SELECT DISTINCT product_id FROM forecast_data`;
    const productRows = await demandDB.rawQueryAll(productSql);
    
    const results: ForecastResult[] = [];
    
    // Step 2 & 3: For each product, get quantities and calculate Huber estimates
    for (const row of productRows) {
      const productId = row.product_id as string;
      
      // Get quantities for this product
      const quantitySql = `SELECT quantity FROM forecast_data WHERE product_id = '${productId}'`;
      const quantityRows = await demandDB.rawQueryAll(quantitySql);
      
      const quantities = quantityRows.map(r => r.quantity as number);
      
      // Get product name
      const productNameSql = `SELECT DISTINCT product_name FROM forecast_data WHERE product_id = '${productId}' LIMIT 1`;
      const productNameRow = await demandDB.rawQueryRow(productNameSql);
      const productName = productNameRow?.product_name as string || productId;
      
      // Calculate Huber estimates
      const { location, scale } = huberEstimator(quantities);
      
      // Step 4: Update product_data table
      const updateSQL = `
        UPDATE product_data 
        SET
          forecast = ${location},
          dmd_stdev = ${scale},
					dl = forecast * lead_time_months,
					eoq = sqrt(2*forecast*ordering_cost/holding_cost),
					ss = 1.96*dmd_stdev*sqrt(lead_time_months),
					rop = ss + dl,
          updated_at = NOW()
				WHERE product_id = '${productId}'
      `;
      await demandDB.rawExec(updateSQL);
      
      results.push({
        productId,
        productName,
        forecast: location,
        dmdStdev: scale,
      });
    }
    
    return { results };
  }
);