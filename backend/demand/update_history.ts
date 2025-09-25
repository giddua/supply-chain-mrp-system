import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { demandDB } from "./db";

interface GetUpdateHistoryParams {
  page?: Query<number>;
  limit?: Query<number>;
}

interface UpdateHistoryRecord {
  id: number;
  monthYear: string | null;
  productId: string | null;
  customerId: string | null;
  percentage: number;
  description: string;
  recordsAffected: number;
  sqlQuery: string;
  createdAt: string;
}

interface UpdateHistoryResponse {
  records: UpdateHistoryRecord[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Retrieves the history of bulk updates performed on demand data.
export const getUpdateHistory = api<GetUpdateHistoryParams, UpdateHistoryResponse>(
  { expose: true, method: "GET", path: "/demand/update-history" },
  async (params) => {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await demandDB.queryRow<{ total_count: number }>`
      SELECT COUNT(*) as total_count
      FROM demand_update_history
    `;

    const totalCount = countResult?.total_count || 0;

    // Get paginated records
    const records = await demandDB.queryAll<{
      id: number;
      month_year: string | null;
      product_id: string | null;
      customer_id: string | null;
      percentage: number;
      description: string;
      records_affected: number;
      sql_query: string;
      created_at: string;
    }>`
      SELECT 
        id,
        month_year,
        product_id,
        customer_id,
        percentage,
        description,
        records_affected,
        sql_query,
        created_at
      FROM demand_update_history
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalPages = Math.ceil(totalCount / limit);

    return {
      records: records.map(record => ({
        id: record.id,
        monthYear: record.month_year,
        productId: record.product_id,
        customerId: record.customer_id,
        percentage: record.percentage,
        description: record.description,
        recordsAffected: record.records_affected,
        sqlQuery: record.sql_query,
        createdAt: record.created_at,
      })),
      totalCount,
      page,
      limit,
      totalPages,
    };
  }
);
