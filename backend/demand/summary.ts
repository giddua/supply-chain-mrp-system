import { api } from "encore.dev/api";
import { demandDB } from "./db";

interface DemandSummaryResponse {
  totalRecords: number;
  totalQuantity: number;
  uniqueProducts: number;
  uniqueCustomers: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  productDemandByMonth: Array<{
    productId: string;
    productName: string;
    monthlyDemand: Array<{
      year: number;
      month: number;
      monthName: string;
      totalQuantity: number;
    }>;
  }>;
}

// Retrieves summary statistics for customer demand data.
export const getDemandSummary = api<void, DemandSummaryResponse>(
  { expose: true, method: "GET", path: "/demand/summary" },
  async () => {
    // Get total records and quantity
    const totalStats = await demandDB.queryRow<{
      total_records: number;
      total_quantity: number;
    }>`
      SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(quantity), 0) as total_quantity
      FROM customer_demand
    `;
    
    // Get unique counts
    const uniqueStats = await demandDB.queryRow<{
      unique_products: number;
      unique_customers: number;
    }>`
      SELECT 
        COUNT(DISTINCT product_id) as unique_products,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM customer_demand
    `;
    
    // Get date range
    const dateRange = await demandDB.queryRow<{
      start_date: string | null;
      end_date: string | null;
    }>`
      SELECT 
        MIN(demand_date)::text as start_date,
        MAX(demand_date)::text as end_date
      FROM customer_demand
    `;
    
    // Get product demand by month and year
    const productMonthlyDemand = await demandDB.queryAll<{
      product_id: string;
      product_name: string;
      year: number;
      month: number;
      total_quantity: number;
    }>`
      SELECT 
        product_id,
        product_name,
        EXTRACT(YEAR FROM demand_date)::int as year,
        EXTRACT(MONTH FROM demand_date)::int as month,
        SUM(quantity) as total_quantity
      FROM customer_demand
      GROUP BY product_id, product_name, EXTRACT(YEAR FROM demand_date), EXTRACT(MONTH FROM demand_date)
      ORDER BY product_name, year, month
    `;

    // Transform the data to group by product
    const productDemandMap = new Map<string, {
      productId: string;
      productName: string;
      monthlyDemand: Array<{
        year: number;
        month: number;
        monthName: string;
        totalQuantity: number;
      }>;
    }>();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    for (const row of productMonthlyDemand) {
      const key = row.product_id;
      
      if (!productDemandMap.has(key)) {
        productDemandMap.set(key, {
          productId: row.product_id,
          productName: row.product_name,
          monthlyDemand: []
        });
      }

      const product = productDemandMap.get(key)!;
      product.monthlyDemand.push({
        year: row.year,
        month: row.month,
        monthName: monthNames[row.month - 1],
        totalQuantity: row.total_quantity
      });
    }

    const productDemandByMonth = Array.from(productDemandMap.values());
    
    return {
      totalRecords: totalStats?.total_records || 0,
      totalQuantity: totalStats?.total_quantity || 0,
      uniqueProducts: uniqueStats?.unique_products || 0,
      uniqueCustomers: uniqueStats?.unique_customers || 0,
      dateRange: {
        startDate: dateRange?.start_date || null,
        endDate: dateRange?.end_date || null,
      },
      productDemandByMonth
    };
  }
);
