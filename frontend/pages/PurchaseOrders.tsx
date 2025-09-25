import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PurchaseOrders() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
        <p className="text-muted-foreground mt-2">
          Create purchase orders for products below reorder point
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
            This section will handle purchase order creation and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features planned for this section:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Automatic PO generation for low stock items</li>
            <li>Supplier management</li>
            <li>Purchase order approval workflow</li>
            <li>Order tracking and status updates</li>
            <li>Purchase order history and reports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
