import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import DemandSummary from "../components/DemandSummary";

export default function DemandUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    recordsProcessed: number;
    productRecordsProcessed: number;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload file
      const result = await backend.demand.uploadDemandFile({
        fileData,
        fileName: file.name,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      setUploadComplete(true);

      toast({
        title: "Upload successful",
        description: result.message,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Data</h1>
        <p className="text-muted-foreground mt-2">
          Upload an Excel file containing Customer Demand data and Product data
        </p>
      </div>

      {!uploadComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel File Upload
            </CardTitle>
            <CardDescription>
              Upload your Excel file with customer demand data and product data. The file must contain both "Customer_Demand" and "Products" tabs with the required columns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : uploading
                  ? "border-muted bg-muted/5 cursor-not-allowed"
                  : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {uploading ? (
                <div className="space-y-4">
                  <p className="text-foreground font-medium">Processing file...</p>
                  <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress < 90 ? "Uploading..." : "Processing demand data..."}
                  </p>
                </div>
              ) : isDragActive ? (
                <p className="text-foreground font-medium">Drop the Excel file here</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    Drag and drop an Excel file here, or click to select
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              )}
            </div>

            {uploadResult && uploadResult.success && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully processed {uploadResult.recordsProcessed.toLocaleString()} demand records and {uploadResult.productRecordsProcessed.toLocaleString()} product records
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>File Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Your Excel file must contain both "Customer_Demand" and "Products" sheets with the following columns:
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Customer_Demand Sheet:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                  <li>• Demand Date (Excel date format)</li>
                  <li>• Product ID</li>
                  <li>• Product Name</li>
                  <li>• Customer ID</li>
                  <li>• Customer Name</li>
                  <li>• Quantity (numeric value)</li>
                </ul>
                
                <h4 className="font-medium text-foreground mb-3">Products Sheet:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Product ID</li>
                  <li>• Product Name</li>
                  <li>• Cost (numeric)</li>
                  <li>• Lead Time Months (numeric)</li>
                  <li>• Ordering Cost (numeric)</li>
                  <li>• Holding Cost (numeric)</li>
                  <li>• EOQ (numeric)</li>
                  <li>• ROP (numeric)</li>
                  <li>• SS (numeric)</li>
                  <li>• DL (numeric)</li>
                  <li>• Forecast (numeric)</li>
                  <li>• Dmd Stdev (numeric)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">Data Guidelines:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• All columns are required</li>
                  <li>• Dates should be in Excel date format</li>
                  <li>• Numeric values can be decimal</li>
                  <li>• No empty rows in the data</li>
                  <li>• File size limit: 50MB</li>
                  <li>• Product IDs should match between sheets</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadComplete && uploadResult?.success && (
        <DemandSummary />
      )}
    </div>
  );
}
