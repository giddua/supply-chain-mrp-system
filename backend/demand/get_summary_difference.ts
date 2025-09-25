import { api } from "encore.dev/api";
import { demandDB } from "./db";

interface SummaryDifferenceResponse {
  totalOriginal: number;
  totalModified: number;
  difference: number;
  percentageChange: number;
  recordsChanged: number;
  recordsTotal: number;
  productMonthDifferences: Array<{
    productId: string;
    productName: string;
    year: number;
    month: number;
    monthName: string;
    originalQuantity: number;
    modifiedQuantity: number;
    difference: number;
    percentageChange: number;
  }>;
}

// Retrieves summary differences between original and modified demand data.
export const getSummaryDifference = api<void, SummaryDifferenceResponse>(
  { expose: true, method: "GET", path: "/demand/summary-difference" },
  async () => {
    // Get totals from both tables
    const originalTotal = await demandDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM customer_demand
    `;

    const modifiedTotal = await demandDB.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM modified_demand_data
    `;

    const totalOriginal = originalTotal?.total || 0;
    const totalModified = modifiedTotal?.total || 0;
    const difference = totalModified - totalOriginal;
    const percentageChange = totalOriginal > 0 ? ((difference / totalOriginal) * 100) : 0;

    // Count records that have been changed
    const changedRecords = await demandDB.queryRow<{ 
      changed_count: number;
      total_count: number;
    }>`
      SELECT 
        COUNT(CASE WHEN COALESCE(m.quantity, 0) != COALESCE(o.quantity, 0) THEN 1 END) as changed_count,
        COUNT(*) as total_count
      FROM customer_demand o
      FULL OUTER JOIN modified_demand_data m ON (
        o.demand_date = m.demand_date AND 
        o.product_id = m.product_id AND 
        o.customer_id = m.customer_id
      )
    `;

    const recordsChanged = changedRecords?.changed_count || 0;
    const recordsTotal = changedRecords?.total_count || 0;

    // Get product-month level differences (only showing months with changes)
    const productMonthDifferences = await demandDB.queryAll<{
      product_id: string;
      product_name: string;
      year: number;
      month: number;
      original_quantity: number;
      modified_quantity: number;
    }>`
      SELECT 
        COALESCE(o.product_id, m.product_id) as product_id,
        COALESCE(o.product_name, m.product_name) as product_name,
        COALESCE(EXTRACT(YEAR FROM o.demand_date), EXTRACT(YEAR FROM m.demand_date))::int as year,
        COALESCE(EXTRACT(MONTH FROM o.demand_date), EXTRACT(MONTH FROM m.demand_date))::int as month,
        COALESCE(SUM(o.quantity), 0) as original_quantity,
        COALESCE(SUM(m.quantity), 0) as modified_quantity
      FROM customer_demand o
      FULL OUTER JOIN modified_demand_data m ON (
        o.product_id = m.product_id AND 
        EXTRACT(YEAR FROM o.demand_date) = EXTRACT(YEAR FROM m.demand_date) AND
        EXTRACT(MONTH FROM o.demand_date) = EXTRACT(MONTH FROM m.demand_date)
      )
      GROUP BY 
        COALESCE(o.product_id, m.product_id), 
        COALESCE(o.product_name, m.product_name),
        COALESCE(EXTRACT(YEAR FROM o.demand_date), EXTRACT(YEAR FROM m.demand_date)),
        COALESCE(EXTRACT(MONTH FROM o.demand_date), EXTRACT(MONTH FROM m.demand_date))
      HAVING COALESCE(SUM(o.quantity), 0) != COALESCE(SUM(m.quantity), 0)
      ORDER BY 
        COALESCE(o.product_name, m.product_name),
        COALESCE(EXTRACT(YEAR FROM o.demand_date), EXTRACT(YEAR FROM m.demand_date)),
        COALESCE(EXTRACT(MONTH FROM o.demand_date), EXTRACT(MONTH FROM m.demand_date))
    `;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      totalOriginal,
      totalModified,
      difference,
      percentageChange,
      recordsChanged,
      recordsTotal,
      productMonthDifferences: productMonthDifferences.map(pmd => {
        const diff = pmd.modified_quantity - pmd.original_quantity;
        const pctChange = pmd.original_quantity > 0 ? ((diff / pmd.original_quantity) * 100) : 0;
        
        return {
          productId: pmd.product_id,
          productName: pmd.product_name,
          year: pmd.year,
          month: pmd.month,
          monthName: monthNames[pmd.month - 1],
          originalQuantity: pmd.original_quantity,
          modifiedQuantity: pmd.modified_quantity,
          difference: diff,
          percentageChange: pctChange,
        };
      }),
    };
  }
);
