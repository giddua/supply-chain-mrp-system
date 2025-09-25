import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("demand");

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ListTablesResponse {
  tables: TableInfo[];
}

export const listTables = api<void, ListTablesResponse>(
  { expose: true, method: "GET", path: "/list-tables" },
  async (): Promise<ListTablesResponse> => {
    // Get all tables in the database
    const tables = await db.queryAll<{ table_name: string }>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableInfos: TableInfo[] = [];
    
    // Get row count for each table
    for (const table of tables) {
      const countResult = await db.rawQueryRow<{ count: string }>(
        `SELECT COUNT(*) as count FROM "${table.table_name}"`
      );
      
      tableInfos.push({
        name: table.table_name,
        rowCount: parseInt(countResult?.count || "0", 10),
      });
    }

    return { tables: tableInfos };
  }
);