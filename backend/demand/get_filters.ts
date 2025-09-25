import { api } from "encore.dev/api";
import { demandDB } from "./db";

interface FilterOptions {
  monthYears: Array<{
    value: string;
    label: string;
    month: number;
    year: number;
  }>;
  products: Array<{
    productId: string;
    productName: string;
    label: string;
  }>;
  customers: Array<{
    customerId: string;
    customerName: string;
    label: string;
  }>;
}

// Retrieves filter options for bulk modifications from the modified demand data.
export const getFilterOptions = api<void, FilterOptions>(
  { expose: true, method: "GET", path: "/demand/filter-options" },
  async () => {
    // Get unique month-year combinations
    const monthYearData = await demandDB.queryAll<{
      month: number;
      year: number;
      month_name: string;
    }>`
      SELECT DISTINCT 
        EXTRACT(MONTH FROM demand_date)::int as month,
        EXTRACT(YEAR FROM demand_date)::int as year,
        TO_CHAR(demand_date, 'Mon') as month_name
      FROM modified_demand_data
      ORDER BY year DESC, month DESC
    `;

    const monthYears = monthYearData.map(item => ({
      value: `${item.year}-${item.month.toString().padStart(2, '0')}`,
      label: `${item.month_name} ${item.year}`,
      month: item.month,
      year: item.year,
    }));

    // Get unique products
    const productData = await demandDB.queryAll<{
      product_id: string;
      product_name: string;
    }>`
      SELECT DISTINCT product_id, product_name
      FROM modified_demand_data
      ORDER BY product_name
    `;

    const products = productData.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      label: `${item.product_name} (${item.product_id})`,
    }));

    // Get unique customers
    const customerData = await demandDB.queryAll<{
      customer_id: string;
      customer_name: string;
    }>`
      SELECT DISTINCT customer_id, customer_name
      FROM modified_demand_data
      ORDER BY customer_name
    `;

    const customers = customerData.map(item => ({
      customerId: item.customer_id,
      customerName: item.customer_name,
      label: `${item.customer_name} (${item.customer_id})`,
    }));

    return {
      monthYears,
      products,
      customers,
    };
  }
);
