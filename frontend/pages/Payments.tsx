import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Payments() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
        <p className="text-muted-foreground mt-2">
          Process payments to suppliers
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
            This section will handle payment processing and tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features planned for this section:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Payment scheduling and processing</li>
            <li>Payment method management</li>
            <li>Payment approval workflow</li>
            <li>Cash flow planning</li>
            <li>Payment history and reporting</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
