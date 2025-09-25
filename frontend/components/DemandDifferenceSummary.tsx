import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileBarChart,
} from "lucide-react";
import backend from "~backend/client";

interface SummaryDifferenceData {
  totalOriginal: number;
  totalModified: number;
  difference: number;
  percentageChange: number;
  recordsChanged: number;
  recordsTotal: number;
  productMonthDifferences: Array<{
    productId: string;
    productName: string;
    year: number;
    month: number;
    monthName: string;
    originalQuantity: number;
    modifiedQuantity: number;
    difference: number;
    percentageChange: number;
  }>;
}

interface Props {
  refreshTrigger?: number;
}

export default function DemandDifferenceSummary({ refreshTrigger }: Props) {
  const [data, setData] = useState<SummaryDifferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const summary = await backend.demand.getSummaryDifference();
        setData(summary);
      } catch (error) {
        console.error("Failed to fetch summary difference:", error);
        toast({
          title: "Error",
          description: "Failed to load summary difference",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [toast, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground">Summary of Changes</h3>
        <p className="text-muted-foreground">
          Comparison between original demand data and modified demand data
        </p>
      </div>

      {/* Records Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Records Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Records Changed</p>
              <p className="text-lg font-medium">{data.recordsChanged.toLocaleString()}</p>
            </div>
            <div className="text-muted-foreground">of</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-lg font-medium">{data.recordsTotal.toLocaleString()}</p>
            </div>
            <div className="ml-auto">
              <Badge variant="secondary">
                {data.recordsTotal > 0 ? ((data.recordsChanged / data.recordsTotal) * 100).toFixed(1) : 0}% affected
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product-Month Level Changes */}
      {data.productMonthDifferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Changes by Month</CardTitle>
            <CardDescription>Products with modified demand quantities by month (only showing changed months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.productMonthDifferences.map((productMonth, index) => (
                <div key={`${productMonth.productId}-${productMonth.year}-${productMonth.month}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{productMonth.productName}</h4>
                      <p className="text-sm text-muted-foreground">
                        ID: {productMonth.productId} • {productMonth.monthName} {productMonth.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(productMonth.difference)}
                      <Badge variant={productMonth.difference > 0 ? "default" : "destructive"}>
                        {productMonth.percentageChange > 0 ? "+" : ""}{productMonth.percentageChange.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Original</p>
                      <p className="font-medium">{productMonth.originalQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Modified</p>
                      <p className="font-medium">{productMonth.modifiedQuantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Difference</p>
                      <p className={`font-medium ${getTrendColor(productMonth.difference)}`}>
                        {productMonth.difference > 0 ? "+" : ""}{productMonth.difference.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.productMonthDifferences.length === 0 && data.difference === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No differences detected between original and modified demand data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
