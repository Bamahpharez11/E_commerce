import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ShoppingCart, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  description: string;
  quality_grade: string;
  harvest_date: string;
  available_until: string;
  farmer: {
    full_name: string;
    business_name: string;
    location_region: string;
    location_district: string;
  };
}

export default function BrowseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select(`
          *,
          farmer:farmer_id (
            full_name,
            business_name,
            location_region,
            location_district
          )
        `)
        .eq("status", "available")
        .gte("available_until", new Date().toISOString().split("T")[0]);

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data as any || []);
    } catch (error: any) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQualityColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-500";
      case "B":
        return "bg-yellow-500";
      case "C":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    await addToCart(productId, 1);
    setAddingToCart(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/buyer")} className="mb-4">
              ← Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-2">Browse Products</h1>
            <p className="text-muted-foreground">Fresh produce from Ghanaian farmers</p>
          </div>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/cart")}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="tubers">Tubers</SelectItem>
                  <SelectItem value="livestock">Livestock</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Check back later for new products"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{product.product_name}</CardTitle>
                    <Badge className={getQualityColor(product.quality_grade)}>
                      Grade {product.quality_grade}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description || "Fresh produce"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Price */}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        GH₵ {product.price_per_unit}
                      </span>
                      <span className="text-sm text-muted-foreground">per {product.unit}</span>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        {product.quantity} {product.unit} available
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Farmer Info */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {product.farmer.business_name || product.farmer.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {product.farmer.location_district}, {product.farmer.location_region}
                        </span>
                      </div>
                    </div>

                    {/* Available Until */}
                    <div className="text-xs text-muted-foreground">
                      Available until: {new Date(product.available_until).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <Button 
                      className="w-full"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingToCart === product.id}
                    >
                      {addingToCart === product.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
