import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function EOQCalculation() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">EOQ, Safety Stock & ROP</h1>
        <p className="text-muted-foreground mt-2">
          Calculate Economic Order Quantity, Safety Stock, and Reorder Point for each product
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
            This section will provide inventory optimization calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features planned for this section:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Economic Order Quantity (EOQ) calculation</li>
            <li>Safety Stock determination based on demand variability</li>
            <li>Reorder Point (ROP) calculation</li>
            <li>Lead time analysis</li>
            <li>Cost optimization parameters</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
