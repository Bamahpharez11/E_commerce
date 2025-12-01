import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const { cartItems, loading, updateQuantity, removeFromCart, clearCart, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item.product.price_per_unit * item.quantity);
  }, 0);

  const handleQuantityChange = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    await updateQuantity(itemId, newQty);
  };

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      toast.error("Please enter a delivery address");
      return;
    }

    setCheckingOut(true);

    try {
      // Create orders for each cart item
      const orderPromises = cartItems.map(item => 
        supabase.from("orders").insert({
          buyer_id: user?.id,
          farmer_id: item.product.farmer_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price_per_unit,
          total_price: item.product.price_per_unit * item.quantity,
          delivery_address: deliveryAddress,
          notes: notes || null,
          status: "pending",
        })
      );

      const results = await Promise.all(orderPromises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error("Failed to create some orders");
      }

      await clearCart();
      toast.success("Orders placed successfully!");
      navigate("/buyer");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to place orders");
    } finally {
      setCheckingOut(false);
    }
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
        <Button variant="ghost" onClick={() => navigate("/browse-products")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Button>

        <h1 className="text-4xl font-bold mb-8">Shopping Cart ({cartCount})</h1>

        {cartItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add some products to get started!</p>
              <Button onClick={() => navigate("/browse-products")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.product.product_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          from {item.product.farmer.full_name} • {item.product.farmer.location_region}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          GH₵ {item.product.price_per_unit} / {item.product.unit}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="font-bold">
                          GH₵ {(item.product.price_per_unit * item.quantity).toFixed(2)}
                        </p>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>GH₵ {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">GH₵ {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Delivery Address *</label>
                      <Textarea
                        placeholder="Enter your delivery address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
                      <Textarea
                        placeholder="Any special instructions?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkingOut || cartItems.length === 0}
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Place Order
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                    disabled={checkingOut}
                  >
                    Clear Cart
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
