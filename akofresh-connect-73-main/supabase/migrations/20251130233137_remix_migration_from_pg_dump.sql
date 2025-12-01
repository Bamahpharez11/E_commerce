CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  year_month TEXT;
  sequence_num INT;
  order_num TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 12) AS INT)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'AKF-' || year_month || '-%';
  
  order_num := 'AKF-' || year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN order_num;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name, phone_number, email, location_region, location_district)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'location_region', ''),
    COALESCE(NEW.raw_user_meta_data->>'location_district', '')
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: set_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_order_number() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > (0)::numeric))
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    farmer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    delivery_address text,
    notes text,
    order_number text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    confirmed_at timestamp with time zone,
    delivered_at timestamp with time zone,
    CONSTRAINT orders_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_transit'::text, 'delivered'::text, 'cancelled'::text]))),
    CONSTRAINT orders_total_price_check CHECK ((total_price > (0)::numeric)),
    CONSTRAINT orders_unit_price_check CHECK ((unit_price > (0)::numeric))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    farmer_id uuid NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text NOT NULL,
    price_per_unit numeric(10,2) NOT NULL,
    description text,
    harvest_date date,
    available_from date NOT NULL,
    available_until date NOT NULL,
    product_image text,
    quality_grade text DEFAULT 'B'::text,
    status text DEFAULT 'available'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT products_category_check CHECK ((category = ANY (ARRAY['vegetables'::text, 'fruits'::text, 'grains'::text, 'tubers'::text, 'livestock'::text, 'other'::text]))),
    CONSTRAINT products_price_per_unit_check CHECK ((price_per_unit > (0)::numeric)),
    CONSTRAINT products_quality_grade_check CHECK ((quality_grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text]))),
    CONSTRAINT products_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT products_status_check CHECK ((status = ANY (ARRAY['available'::text, 'reserved'::text, 'sold'::text, 'expired'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_type text NOT NULL,
    full_name text NOT NULL,
    phone_number text NOT NULL,
    email text,
    business_name text,
    location_region text NOT NULL,
    location_district text NOT NULL,
    location_address text,
    verification_status text DEFAULT 'pending'::text,
    profile_photo_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT profiles_user_type_check CHECK ((user_type = ANY (ARRAY['farmer'::text, 'buyer'::text]))),
    CONSTRAINT profiles_verification_status_check CHECK ((verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])))
);


--
-- Name: cart_items cart_items_buyer_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_buyer_id_product_id_key UNIQUE (buyer_id, product_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_phone_number_key UNIQUE (phone_number);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: idx_cart_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_buyer ON public.cart_items USING btree (buyer_id);


--
-- Name: idx_cart_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_product ON public.cart_items USING btree (product_id);


--
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);


--
-- Name: idx_orders_farmer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_farmer ON public.orders USING btree (farmer_id);


--
-- Name: idx_orders_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_product ON public.orders USING btree (product_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_products_availability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_availability ON public.products USING btree (available_from, available_until);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_farmer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_farmer ON public.products USING btree (farmer_id);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_profiles_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone_number);


--
-- Name: idx_profiles_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_type ON public.profiles USING btree (user_type);


--
-- Name: idx_profiles_verification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_verification ON public.profiles USING btree (verification_status);


--
-- Name: orders set_order_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_number();


--
-- Name: profiles set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cart_items update_cart_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: cart_items cart_items_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: orders orders_farmer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_farmer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles Allow profile creation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: products Anyone can view available products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view available products" ON public.products FOR SELECT USING ((status = 'available'::text));


--
-- Name: orders Buyers can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: orders Buyers can update their pending orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can update their pending orders" ON public.orders FOR UPDATE USING (((auth.uid() = buyer_id) AND (status = 'pending'::text)));


--
-- Name: orders Buyers can view their own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can view their own orders" ON public.orders FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: products Farmers can create their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can create their own products" ON public.products FOR INSERT WITH CHECK (((auth.uid() = farmer_id) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.user_type = 'farmer'::text))))));


--
-- Name: products Farmers can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can delete their own products" ON public.products FOR DELETE USING ((auth.uid() = farmer_id));


--
-- Name: orders Farmers can update order status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can update order status" ON public.orders FOR UPDATE USING ((auth.uid() = farmer_id));


--
-- Name: products Farmers can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can update their own products" ON public.products FOR UPDATE USING ((auth.uid() = farmer_id));


--
-- Name: orders Farmers can view orders for their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Farmers can view orders for their products" ON public.orders FOR SELECT USING ((auth.uid() = farmer_id));


--
-- Name: cart_items Users can add to their cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add to their cart" ON public.cart_items FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: cart_items Users can delete from their cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete from their cart" ON public.cart_items FOR DELETE USING ((auth.uid() = buyer_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: cart_items Users can update their cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their cart" ON public.cart_items FOR UPDATE USING ((auth.uid() = buyer_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: cart_items Users can view their own cart; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


