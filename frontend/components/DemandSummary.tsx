import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Package,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  Database,
} from "lucide-react";
import backend from "~backend/client";

interface DemandSummaryData {
  totalRecords: number;
  totalQuantity: number;
  uniqueProducts: number;
  uniqueCustomers: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  productDemandByMonth: Array<{
    productId: string;
    productName: string;
    monthlyDemand: Array<{
      year: number;
      month: number;
      monthName: string;
      totalQuantity: number;
    }>;
  }>;
}

export default function DemandSummary() {
  const [data, setData] = useState<DemandSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summary = await backend.demand.getDemandSummary();
        setData(summary);
      } catch (error) {
        console.error("Failed to fetch demand summary:", error);
        toast({
          title: "Error",
          description: "Failed to load demand summary",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Demand Data Summary</h2>
        <p className="text-muted-foreground">Overview of uploaded customer demand data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRecords.toLocaleString()}</div>
          </CardContent>
        </Card>
				{/*
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalQuantity.toLocaleString()}</div>
          </CardContent>
        </Card>
				*/}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uniqueProducts.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.uniqueCustomers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="h-5 w-5" />
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(data.dateRange.startDate)}</p>
            </div>
            <div className="text-muted-foreground">→</div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="font-medium">{formatDate(data.dateRange.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Demand by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Demand by Month
          </CardTitle>
          <CardDescription>Monthly demand breakdown for each product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.productDemandByMonth.map((product) => (
              <div key={product.productId} className="border rounded-lg p-4">
                <div className="mb-4">
                  <h4 className="font-semibold text-foreground">{product.productName}</h4>
                  <p className="text-sm text-muted-foreground">ID: {product.productId}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {product.monthlyDemand.map((month) => (
                    <div
                      key={`${month.year}-${month.month}`}
                      className="bg-accent/50 rounded-md p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {month.monthName} {month.year}
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {month.totalQuantity.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          units
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {data.productDemandByMonth.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No product demand data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
