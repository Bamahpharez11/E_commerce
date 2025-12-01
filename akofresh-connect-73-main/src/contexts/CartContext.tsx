import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    product_name: string;
    price_per_unit: number;
    unit: string;
    category: string;
    product_image?: string;
    farmer_id: string;
    farmer: {
      full_name: string;
      location_region: string;
    };
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          product:product_id (
            id,
            product_name,
            price_per_unit,
            unit,
            category,
            product_image,
            farmer_id,
            farmer:farmer_id (
              full_name,
              location_region
            )
          )
        `)
        .eq("buyer_id", user.id);

      if (error) throw error;
      setCartItems(data as any || []);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantity: number) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          buyer_id: user.id,
          product_id: productId,
          quantity,
        });

      if (error) throw error;

      await fetchCart();
      toast.success("Item added to cart!");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;

      await fetchCart();
      toast.success("Quantity updated");
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("buyer_id", user.id);

      if (error) throw error;

      await fetchCart();
      toast.success("Cart cleared");
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
