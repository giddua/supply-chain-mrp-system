import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { ProductForecast } from "~backend/demand/list_products";

export default function Forecast() {
  const [products, setProducts] = useState<ProductForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await backend.demand.listProducts();
      setProducts(response.products);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "Failed to load product forecast data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processForecast = async () => {
    try {
      setProcessing(true);
      await backend.demand.processForecast();
      toast({
        title: "Success",
        description: "Forecast processing completed successfully",
      });
      await loadProducts(); // Reload data after processing
    } catch (error) {
      console.error("Error processing forecast:", error);
      toast({
        title: "Error", 
        description: "Failed to process forecast data",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Demand Forecast</h1>
        <p className="text-muted-foreground mt-2">
          Process and view product demand forecasts using Huber's method and depdendent MRP parameters
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Click "Process Forecast" to calculate location (forecast) and scale (demand standard deviation) 
          for each product using Huber's robust statistical method based on historical forecast data.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Forecast Processing
          </CardTitle>
          <CardDescription>
            Generate demand forecasts and standard deviations from historical data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={processForecast}
              disabled={processing}
              className="flex items-center gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {processing ? "Processing..." : "Process Forecast"}
            </Button>
            <Button 
              variant="outline"
              onClick={loadProducts}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Forecasts</CardTitle>
          <CardDescription>
            Product demand forecasts and standard deviations calculated using Huber's method
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No product data available.</p>
              <p className="text-sm mt-2">Process forecast data first to see results.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Forecast</TableHead>
                    <TableHead className="text-right">Demand Std Dev</TableHead>
                    <TableHead className="text-right">CV%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const cv = product.forecast > 0 ? (product.dmdStdev / product.forecast) * 100 : 0;
                    const cvVariant = cv > 50 ? "destructive" : cv > 25 ? "secondary" : "default";
                    
                    return (
                      <TableRow key={product.productId}>
                        <TableCell className="font-mono">{product.productId}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right font-mono">
                          {product.forecast.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {product.dmdStdev.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={cvVariant}>
                            {cv.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}