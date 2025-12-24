import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Download, TrendingUp, Package, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import RecoveryEmailSettings from "@/components/admin/RecoveryEmailSettings";
import { OfferExperimentManager } from "@/components/admin/OfferExperimentManager";
import { ProductManager } from "@/components/admin/ProductManager";
const Admin = () => {
  const [file, setFile] = useState<File | null>(null);

  // Mock analytics data
  const analytics = {
    totalOrders: 1247,
    totalRevenue: 156890,
    averageOrder: 125.8,
    weeklyTransactions: 89,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    // Mock CSV import
    toast.success(`Importing ${file.name}...`);
    setTimeout(() => {
      toast.success("Products imported successfully!");
      setFile(null);
    }, 1500);
  };

  const handleDownloadTemplate = () => {
    const csvContent = `id,name,brand,category,description,image,variant_size,variant_price,variant_stock,is_bestseller,discount,original_price
1,Sample Product,Brand Name,Category,Product description,https://example.com/image.jpg,100gms,99,50,true,10,110`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <Link to="/analytics">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-secondary">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-secondary">+18.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Order
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.averageOrder}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-secondary">+5.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Weekly Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.weeklyTransactions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-secondary">+8.3%</span> from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
            <TabsTrigger value="emails">Recovery Emails</TabsTrigger>
            <TabsTrigger value="experiments">Experiments</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          <TabsContent value="import">
            {/* CSV Import Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file to bulk import products. Make sure your CSV follows the template format.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="csv-file">Select CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                    {file && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>

                  <Button onClick={handleImport} className="w-full" disabled={!file}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Products
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    CSV Template
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Download the CSV template to see the required format for importing products.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">Template includes:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Product information (name, brand, category)</li>
                      <li>• Variant details (size, price, stock)</li>
                      <li>• Image URL and description</li>
                      <li>• Special attributes (bestseller, discount)</li>
                    </ul>
                  </div>

                  <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>CSV Import Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Required Fields</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• id (unique identifier)</li>
                      <li>• name (product name)</li>
                      <li>• brand</li>
                      <li>• category</li>
                      <li>• variant_size (e.g., 100gms, 1kg)</li>
                      <li>• variant_price (in INR)</li>
                      <li>• variant_stock</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Optional Fields</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• description</li>
                      <li>• image (URL)</li>
                      <li>• is_bestseller (true/false)</li>
                      <li>• discount (percentage)</li>
                      <li>• original_price</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails">
            <RecoveryEmailSettings />
          </TabsContent>

          <TabsContent value="experiments">
            <OfferExperimentManager />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
