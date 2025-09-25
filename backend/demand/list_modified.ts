import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { demandDB } from "./db";

interface ListModifiedDemandParams {
  page?: Query<number>;
  limit?: Query<number>;
  productId?: Query<string>;
  customerId?: Query<string>;
  startDate?: Query<string>;
  endDate?: Query<string>;
  search?: Query<string>;
}

interface ModifiedDemandRecord {
  id: number;
  demandDate: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  quantity: number;
  createdAt: string;
  modifiedAt: string;
}

interface ListModifiedDemandResponse {
  records: ModifiedDemandRecord[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Retrieves modified demand data with pagination and filtering options.
export const listModifiedDemand = api<ListModifiedDemandParams, ListModifiedDemandResponse>(
  { expose: true, method: "GET", path: "/demand/modified" },
  async (params) => {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 1000); // Cap at 1000 records per page
    const offset = (page - 1) * limit;
    
    // Build WHERE clause conditions
    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (params.productId) {
      conditions.push(`product_id = $${paramIndex++}`);
      queryParams.push(params.productId);
    }
    
    if (params.customerId) {
      conditions.push(`customer_id = $${paramIndex++}`);
      queryParams.push(params.customerId);
    }
    
    if (params.startDate) {
      conditions.push(`demand_date >= $${paramIndex++}`);
      queryParams.push(params.startDate);
    }
    
    if (params.endDate) {
      conditions.push(`demand_date <= $${paramIndex++}`);
      queryParams.push(params.endDate);
    }
    
    if (params.search) {
      conditions.push(`(
        product_id ILIKE $${paramIndex} OR 
        product_name ILIKE $${paramIndex} OR 
        customer_id ILIKE $${paramIndex} OR 
        customer_name ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${params.search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM modified_demand_data
      ${whereClause}
    `;
    
    const countResult = await demandDB.rawQueryRow<{ total_count: number }>(
      countQuery,
      ...queryParams
    );
    
    const totalCount = countResult?.total_count || 0;
    
    // Get paginated records
    const recordsQuery = `
      SELECT 
        id,
        demand_date,
        product_id,
        product_name,
        customer_id,
        customer_name,
        quantity,
        created_at,
        modified_at
      FROM modified_demand_data
      ${whereClause}
      ORDER BY demand_date DESC, product_name, customer_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const records = await demandDB.rawQueryAll<{
      id: number;
      demand_date: string;
      product_id: string;
      product_name: string;
      customer_id: string;
      customer_name: string;
      quantity: number;
      created_at: string;
      modified_at: string;
    }>(recordsQuery, ...queryParams, limit, offset);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      records: records.map(record => ({
        id: record.id,
        demandDate: record.demand_date,
        productId: record.product_id,
        productName: record.product_name,
        customerId: record.customer_id,
        customerName: record.customer_name,
        quantity: record.quantity,
        createdAt: record.created_at,
        modifiedAt: record.modified_at,
      })),
      totalCount,
      page,
      limit,
      totalPages,
    };
  }
);
