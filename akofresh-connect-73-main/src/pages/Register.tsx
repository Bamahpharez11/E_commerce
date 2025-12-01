import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Northern", "Eastern", "Western",
  "Central", "Volta", "Upper East", "Upper West", "Bono",
  "Bono East", "Ahafo", "Savannah", "North East", "Oti", "Western North"
];

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    userType: "buyer",
    fullName: "",
    phoneNumber: "+233",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    locationRegion: "",
    locationDistrict: "",
    locationAddress: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.phoneNumber || formData.phoneNumber === "+233") {
      newErrors.phoneNumber = "Phone number is required";
    } else {
      // Remove spaces and check format
      const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
      if (!/^\+233[0-9]{9}$/.test(cleanPhone)) {
        newErrors.phoneNumber = "Enter 9 digits after +233 (e.g., +233241234567)";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.locationRegion) {
      newErrors.locationRegion = "Region is required";
    }

    if (!formData.locationDistrict.trim()) {
      newErrors.locationDistrict = "District is required";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    // Clean phone number before saving
    const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
    
    const userData = {
      user_type: formData.userType,
      full_name: formData.fullName,
      phone_number: cleanPhone,
      business_name: formData.businessName || null,
      location_region: formData.locationRegion,
      location_district: formData.locationDistrict,
      location_address: formData.locationAddress || null,
    };

    const { error } = await signUp(
      formData.email || `${cleanPhone.replace('+', '')}@akofresh.temp`,
      formData.password,
      userData
    );

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This phone number or email is already registered");
      } else {
        toast.error(error.message || "Registration failed. Please try again");
      }
    } else {
      toast.success(
        formData.email 
          ? "Registration successful! Please check your email to verify your account before logging in." 
          : "Registration successful! You can now log in.",
        { duration: 5000 }
      );
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">AkoFresh Market</h1>
          <p className="text-muted-foreground">Connecting Farmers with Buyers</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join Ghana's premier agricultural marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>I am a</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => setFormData({ ...formData, userType: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="farmer" id="farmer" />
                    <Label htmlFor="farmer" className="cursor-pointer font-normal">Farmer</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="cursor-pointer font-normal">Buyer</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+233241234567"
                    className={errors.phoneNumber ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">Enter 9 digits after +233 (without the leading 0)</p>
                  {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              {formData.userType === "buyer" && (
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g., Golden Fork Restaurant"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationRegion">Region *</Label>
                  <Select
                    value={formData.locationRegion}
                    onValueChange={(value) => setFormData({ ...formData, locationRegion: value })}
                  >
                    <SelectTrigger className={errors.locationRegion ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {GHANA_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.locationRegion && <p className="text-sm text-destructive">{errors.locationRegion}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationDistrict">District *</Label>
                  <Input
                    id="locationDistrict"
                    value={formData.locationDistrict}
                    onChange={(e) => setFormData({ ...formData, locationDistrict: e.target.value })}
                    className={errors.locationDistrict ? "border-destructive" : ""}
                  />
                  {errors.locationDistrict && <p className="text-sm text-destructive">{errors.locationDistrict}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationAddress">Address (Optional)</Label>
                <Textarea
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  placeholder="Detailed address or directions"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  I accept the terms and conditions
                </Label>
              </div>
              {errors.acceptTerms && <p className="text-sm text-destructive">{errors.acceptTerms}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
