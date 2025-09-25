import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Code, Info, Loader2 } from "lucide-react";
import backend from "~backend/client";
import DemandDifferenceSummary from "../components/DemandDifferenceSummary";

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

export default function ModifyDemand() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [selectedMonthYear, setSelectedMonthYear] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [percentage, setPercentage] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [executing, setExecuting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { toast } = useToast();

  const fetchFilterOptions = async () => {
    try {
      setLoadingOptions(true);
      const options = await backend.demand.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
      toast({
        title: "Error",
        description: "Failed to load filter options",
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Generate dynamic explanation and SQL
  const generateExplanation = () => {
    if (percentage === 0) {
      return {
        explanation: "Explnation of the intended change will be shown here.",
        sql: "",
      };
    }

    const isIncrease = percentage > 0;
    const absPercentage = Math.abs(percentage);
    const multiplier = 1 + (percentage / 100);
    
    let conditions: string[] = [];
    let explanationParts: string[] = [];
    
    // Build explanation parts
    if (selectedMonthYear && selectedMonthYear !== "all") {
      const monthYearOption = filterOptions?.monthYears.find(my => my.value === selectedMonthYear);
      if (monthYearOption) {
        explanationParts.push(`the month of ${monthYearOption.label}`);
        conditions.push(`EXTRACT(YEAR FROM demand_date) = ${monthYearOption.year} AND EXTRACT(MONTH FROM demand_date) = ${monthYearOption.month}`);
      }
    }
    
    if (selectedProductId && selectedProductId !== "all") {
      const productOption = filterOptions?.products.find(p => p.productId === selectedProductId);
      if (productOption) {
        explanationParts.push(`${productOption.productName}`);
        conditions.push(`product_id = '${selectedProductId}'`);
      }
    }
    
    if (selectedCustomerId && selectedCustomerId !== "all") {
      const customerOption = filterOptions?.customers.find(c => c.customerId === selectedCustomerId);
      if (customerOption) {
        explanationParts.push(`${customerOption.customerName}`);
        conditions.push(`customer_id = '${selectedCustomerId}'`);
      }
    }

    // Build explanation text
    let explanation = "All demand data";
    if (explanationParts.length > 0) {
      explanation += " for " + explanationParts.join(" and ");
    }
    explanation += ` will be ${isIncrease ? "increased" : "decreased"} by ${absPercentage}%.`;

    // Build SQL
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `UPDATE modified_demand_data 
SET 
  quantity = quantity * ${multiplier},
  modified_at = NOW()
${whereClause}`;

    return { explanation, sql };
  };

  const { explanation, sql } = generateExplanation();

  const executeUpdate = async () => {
    if (percentage === 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a non-zero percentage",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide a description for this update",
        variant: "destructive",
      });
      return;
    }

    setExecuting(true);
    try {
      const result = await backend.demand.bulkUpdateDemand({
        monthYear: selectedMonthYear && selectedMonthYear !== "all" ? selectedMonthYear : undefined,
        productId: selectedProductId && selectedProductId !== "all" ? selectedProductId : undefined,
        customerId: selectedCustomerId && selectedCustomerId !== "all" ? selectedCustomerId : undefined,
        percentage,
        description: description.trim(),
      });

      toast({
        title: "Update Successful",
        description: result.message,
      });

      // Refresh the summary
      setRefreshTrigger(prev => prev + 1);

      // Reset form
      setSelectedMonthYear("");
      setSelectedProductId("");
      setSelectedCustomerId("");
      setPercentage(0);
      setDescription("");
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  const canExecute = percentage !== 0 && description.trim().length > 0 && !executing;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">S&OP</h1>
        <p className="text-muted-foreground mt-2">
          Adjust demand data by percentage using filters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demand Modification Parameters</CardTitle>
          <CardDescription>
            Select filters and percentage to apply changes to demand data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingOptions ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading filter options...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monthYear">Month-Year (Optional)</Label>
                  <Select
                    value={selectedMonthYear}
                    onValueChange={setSelectedMonthYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All months</SelectItem>
                      {filterOptions?.monthYears.map((monthYear) => (
                        <SelectItem key={monthYear.value} value={monthYear.value}>
                          {monthYear.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Product (Optional)</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      {filterOptions?.products.map((product) => (
                        <SelectItem key={product.productId} value={product.productId}>
                          {product.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer">Customer (Optional)</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All customers</SelectItem>
                      {filterOptions?.customers.map((customer) => (
                        <SelectItem key={customer.customerId} value={customer.customerId}>
                          {customer.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage">Percentage Change</Label>
                  <Input
                    id="percentage"
                    type="number"
                    step="0.1"
                    placeholder="e.g., -10 for 10% decrease"
                    value={percentage || ""}
                    onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use negative values to decrease (e.g., -10 for 10% decrease)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the reason for this modification..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a clear description for this bulk update operation
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview of the intended change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Explanation of Intended Change
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-base">
              {explanation}
            </AlertDescription>
          </Alert>

          {sql && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Corresponding SQL Query
              </Label>
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{sql}</pre>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={executeUpdate}
              disabled={!canExecute}
              className="min-w-32"
            >
              {executing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Update
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary of differences */}
      <DemandDifferenceSummary refreshTrigger={refreshTrigger} />
    </div>
  );
}
