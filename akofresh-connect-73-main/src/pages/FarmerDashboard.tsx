import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, ShoppingCart, DollarSign, Settings, LogOut, User, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FarmerDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();


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
              <p className="text-xs text-muted-foreground">Farmer Portal</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {profile?.full_name}! 🌾
          </h2>
          <p className="text-muted-foreground">Manage your farm products and orders</p>
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
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.full_name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{profile?.full_name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile?.phone_number}</span>
                </div>
                
                {profile?.business_name && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.business_name}</span>
                  </div>
                )}
                
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
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Listed products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
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
            <CardDescription>Manage your farm business</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="w-full justify-start h-auto py-4"
              onClick={() => navigate("/add-product")}
            >
              <Package className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">List New Product</div>
                <div className="text-xs font-normal opacity-90">Add products to marketplace</div>
              </div>
            </Button>

            <Button 
              size="lg" 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Orders</div>
                <div className="text-xs font-normal opacity-90">Track incoming orders</div>
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

      </div>
    </div>
  );
}
