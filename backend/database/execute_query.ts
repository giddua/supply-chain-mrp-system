import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("demand");

interface ExecuteQueryRequest {
  query: string;
}

interface QueryResult {
  type: "select" | "update" | "delete" | "insert" | "other";
  rows?: any[];
  rowsAffected?: number;
  error?: string;
}

export const executeQuery = api<ExecuteQueryRequest, QueryResult>(
  { expose: true, method: "POST", path: "/execute-query" },
  async ({ query }): Promise<QueryResult> => {
    try {
      const trimmedQuery = query.trim().toLowerCase();
      
      if (trimmedQuery.startsWith("select")) {
        // For SELECT queries, return the rows
        const rows = await db.rawQueryAll(query);
        return {
          type: "select",
          rows,
        };
      } else if (
        trimmedQuery.startsWith("update") ||
        trimmedQuery.startsWith("delete") ||
        trimmedQuery.startsWith("insert")
      ) {
        // For UPDATE/DELETE/INSERT queries, we need to count affected rows
        // PostgreSQL doesn't return row count from rawExec, so we'll use a workaround
        let type: "update" | "delete" | "insert" = "update";
        if (trimmedQuery.startsWith("delete")) type = "delete";
        if (trimmedQuery.startsWith("insert")) type = "insert";
        
        await db.rawExec(query);
        
        // For now, we can't get the exact row count from rawExec
        // This is a limitation of the current API
        return {
          type,
          rowsAffected: 0, // Would need to modify this if exact count is needed
        };
      } else {
        // For other queries (CREATE, DROP, etc.)
        await db.rawExec(query);
        return {
          type: "other",
        };
      }
    } catch (error) {
      return {
        type: "other",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
);