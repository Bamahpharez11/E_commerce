import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, ImagePlus } from "lucide-react";

export default function AddProduct() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    description: "",
    quantity: "",
    unit: "",
    price_per_unit: "",
    quality_grade: "B",
    harvest_date: "",
    available_from: "",
    available_until: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPG, PNG, and WebP images are allowed",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile || !profile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please log in to add products",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Insert product
      const { error: insertError } = await supabase
        .from("products")
        .insert({
          farmer_id: profile.id,
          product_name: formData.product_name,
          category: formData.category,
          description: formData.description,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          price_per_unit: parseFloat(formData.price_per_unit),
          quality_grade: formData.quality_grade,
          harvest_date: formData.harvest_date || null,
          available_from: formData.available_from,
          available_until: formData.available_until,
          product_image: imageUrl,
          status: "available",
        });

      if (insertError) throw insertError;

      toast({
        title: "Product listed successfully!",
        description: "Your product is now available for buyers",
      });

      navigate("/farmer");
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Failed to list product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/farmer")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List New Product</CardTitle>
            <CardDescription>
              Add your farm produce to the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Image */}
              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex flex-col gap-4">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <ImagePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a photo of your product
                      </p>
                      <Label
                        htmlFor="image"
                        className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </Label>
                    </div>
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  placeholder="e.g., Fresh Tomatoes"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData({ ...formData, product_name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="tubers">Tubers</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) =>
                      setFormData({ ...formData, unit: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="bunches">Bunches</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                      <SelectItem value="crates">Crates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price and Quality Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_unit">Price per Unit (GH₵) *</Label>
                  <Input
                    id="price_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price_per_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, price_per_unit: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality_grade">Quality Grade *</Label>
                  <Select
                    value={formData.quality_grade}
                    onValueChange={(value) =>
                      setFormData({ ...formData, quality_grade: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Grade A (Premium)</SelectItem>
                      <SelectItem value="B">Grade B (Standard)</SelectItem>
                      <SelectItem value="C">Grade C (Economy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Harvest Date */}
              <div className="space-y-2">
                <Label htmlFor="harvest_date">Harvest Date</Label>
                <Input
                  id="harvest_date"
                  type="date"
                  value={formData.harvest_date}
                  onChange={(e) =>
                    setFormData({ ...formData, harvest_date: e.target.value })
                  }
                />
              </div>

              {/* Availability Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="available_from">Available From *</Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) =>
                      setFormData({ ...formData, available_from: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_until">Available Until *</Label>
                  <Input
                    id="available_until"
                    type="date"
                    value={formData.available_until}
                    onChange={(e) =>
                      setFormData({ ...formData, available_until: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/farmer")}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Listing Product...
                    </>
                  ) : (
                    "List Product"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
