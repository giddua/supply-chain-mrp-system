import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Database as DatabaseIcon, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import backend from "~backend/client";

interface TableInfo {
  name: string;
  rowCount: number;
}

interface QueryResult {
  type: "select" | "update" | "delete" | "insert" | "other";
  rows?: any[];
  rowsAffected?: number;
  error?: string;
}

export default function Database() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const response = await backend.database.listTables();
      setTables(response.tables);
    } catch (error) {
      console.error("Failed to load tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;

    try {
      setQueryLoading(true);
      const result = await backend.database.executeQuery({ query });
      setQueryResult(result);
      
      // Reload tables in case the query modified the database structure
      if (result.type !== "select") {
        loadTables();
      }
    } catch (error) {
      console.error("Query execution failed:", error);
      setQueryResult({
        type: "other",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const renderQueryResult = () => {
    if (!queryResult) return null;

    if (queryResult.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{queryResult.error}</AlertDescription>
        </Alert>
      );
    }

    if (queryResult.type === "select" && queryResult.rows) {
      if (queryResult.rows.length === 0) {
        return (
          <Alert>
            <AlertDescription>Query executed successfully. No rows returned.</AlertDescription>
          </Alert>
        );
      }

      const columns = Object.keys(queryResult.rows[0]);
      
      return (
        <Card>
          <CardHeader>
            <CardTitle>Query Results ({queryResult.rows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResult.rows.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column}>
                          {row[column] !== null ? String(row[column]) : "NULL"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (queryResult.type === "update" || queryResult.type === "delete" || queryResult.type === "insert") {
      return (
        <Alert>
          <AlertDescription>
            Query executed successfully. Operation type: {queryResult.type.toUpperCase()}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert>
        <AlertDescription>Query executed successfully.</AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <DatabaseIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Database Interface</h1>
        <Badge variant="outline" className="ml-2">Development Only</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading tables...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Row Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SQL Query Interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="query" className="text-sm font-medium">
              SQL Query
            </label>
            <Textarea
              id="query"
              placeholder="Enter your SQL query here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px] font-mono"
            />
          </div>
          
          <Button 
            onClick={executeQuery} 
            disabled={!query.trim() || queryLoading}
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-2" />
            {queryLoading ? "Executing..." : "Execute Query"}
          </Button>

          {renderQueryResult()}
        </CardContent>
      </Card>
    </div>
  );
}