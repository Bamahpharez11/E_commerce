import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Leaf, Search, ShoppingCart, DollarSign, Settings, LogOut, User, MapPin, Phone, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface FeaturedProduct {
  id: string;
  product_name: string;
  category: string;
  price_per_unit: number;
  unit: string;
  farmer: {
    full_name: string;
    location_region: string;
  };
}

export default function BuyerDashboard() {
  const { profile, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          product_name,
          category,
          price_per_unit,
          unit,
          farmer:farmer_id (
            full_name,
            location_region
          )
        `)
        .eq("status", "available")
        .gte("available_until", new Date().toISOString().split("T")[0])
        .limit(4);

      if (error) throw error;
      setFeaturedProducts(data as any || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };


  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AkoFresh Market</h1>
              <p className="text-xs text-muted-foreground">Buyer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/cart")}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name}! 🛒
          </h2>
          <p className="text-muted-foreground">Find fresh produce directly from local farmers</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your account information and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.profile_photo_url} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl">
                    {profile?.full_name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{profile?.full_name}</span>
                </div>
                
                {profile?.business_name && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.business_name}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile?.phone_number}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {profile?.location_district}, {profile?.location_region}
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Button variant="outline" onClick={() => navigate("/profile")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS 0.00</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Discover fresh products and manage orders</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="w-full justify-start h-auto py-4"
              onClick={() => navigate("/browse-products")}
            >
              <Search className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Browse Products</div>
                <div className="text-xs font-normal opacity-90">Find fresh produce</div>
              </div>
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">My Orders</div>
                <div className="text-xs font-normal opacity-90">Track your purchases</div>
              </div>
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
            >
              <DollarSign className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Payments</div>
                <div className="text-xs font-normal opacity-90">View payment history</div>
              </div>
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              onClick={() => navigate("/profile")}
            >
              <Settings className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Profile Settings</div>
                <div className="text-xs font-normal opacity-90">Update your information</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Featured Products */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Featured Products</CardTitle>
                <CardDescription>Fresh produce from Ghanaian farmers</CardDescription>
              </div>
              <Button variant="link" onClick={() => navigate("/browse-products")}>
                View All →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No products available yet</p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon for fresh produce</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-lg">{product.product_name}</h4>
                          <Badge variant="secondary" className="capitalize">{product.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{product.farmer.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{product.farmer.location_region}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xl font-bold text-primary">
                            GH₵ {product.price_per_unit}
                            <span className="text-sm text-muted-foreground ml-1">/{product.unit}</span>
                          </span>
                          <Button size="sm" onClick={() => navigate("/browse-products")}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
