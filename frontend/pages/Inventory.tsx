import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Inventory() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          Load and manage product inventory data
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This feature will be implemented in a future step of the MRP system development.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            This section will handle inventory management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features planned for this section:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Load current inventory levels</li>
            <li>Track inventory movements</li>
            <li>Set minimum and maximum stock levels</li>
            <li>Monitor stock availability</li>
            <li>Generate inventory reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
