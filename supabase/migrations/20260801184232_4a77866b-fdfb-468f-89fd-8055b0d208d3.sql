
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'kitchen');
CREATE TYPE public.order_status AS ENUM ('new','accepted','preparing','ready','completed','cancelled');
CREATE TYPE public.fulfilment_type AS ENUM ('delivery','collection');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- MENU
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_es text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_es text NOT NULL,
  description_en text,
  description_es text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_vegan boolean NOT NULL DEFAULT false,
  is_curry boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modifier_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_es text NOT NULL,
  min_select int NOT NULL DEFAULT 0,
  max_select int NOT NULL DEFAULT 1,
  is_required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_en text NOT NULL,
  name_es text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  linked_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, slug)
);

CREATE TABLE public.product_modifier_groups (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, group_id)
);

CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  estimated_minutes int NOT NULL DEFAULT 40,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  restaurant_name text NOT NULL DEFAULT 'Bilbao Spice',
  logo_url text,
  contact_phone text,
  contact_email text,
  address text,
  opening_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_rate numeric(5,4) NOT NULL DEFAULT 0.10,
  payment_provider text NOT NULL DEFAULT 'stripe',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- public read menu tables
GRANT SELECT ON public.categories, public.products, public.modifier_groups, public.modifiers, public.product_modifier_groups, public.delivery_zones, public.restaurant_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories, public.products, public.modifier_groups, public.modifiers, public.product_modifier_groups, public.delivery_zones, public.restaurant_settings TO authenticated;
GRANT ALL ON public.categories, public.products, public.modifier_groups, public.modifiers, public.product_modifier_groups, public.delivery_zones, public.restaurant_settings TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read mgroups" ON public.modifier_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write mgroups" ON public.modifier_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read modifiers" ON public.modifiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write modifiers" ON public.modifiers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read pmg" ON public.product_modifier_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write pmg" ON public.product_modifier_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read zones" ON public.delivery_zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write zones" ON public.delivery_zones FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "public read settings" ON public.restaurant_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write settings" ON public.restaurant_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDERS (kitchen-safe, no PII)
CREATE SEQUENCE public.order_number_seq START 1001;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number int NOT NULL UNIQUE DEFAULT nextval('public.order_number_seq'),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'new',
  fulfilment public.fulfilment_type NOT NULL DEFAULT 'delivery',
  delivery_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  payment_provider text NOT NULL DEFAULT 'stripe',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_number_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.order_number_seq TO anon, authenticated, service_role;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL,
  line_total numeric(10,2) NOT NULL,
  modifiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  special_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- PII isolated from kitchen
CREATE TABLE public.order_contacts (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address_line text,
  city text NOT NULL DEFAULT 'Bilbao',
  postcode text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  address_line text NOT NULL,
  city text NOT NULL DEFAULT 'Bilbao',
  postcode text,
  delivery_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT SELECT, INSERT ON public.order_contacts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.orders, public.order_items, public.order_contacts, public.customer_addresses TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- orders: owner reads own, kitchen/admin read all, guests insert
CREATE POLICY "insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'));
CREATE POLICY "staff update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'));

CREATE POLICY "insert order items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));
CREATE POLICY "read order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kitchen'))));

-- contacts: NEVER visible to kitchen
CREATE POLICY "insert order contacts" ON public.order_contacts FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "read own order contacts" ON public.order_contacts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "own addresses" ON public.customer_addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER t_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== SEED ===========
INSERT INTO public.restaurant_settings (singleton, restaurant_name, contact_phone, contact_email, address, opening_hours)
VALUES (true, 'Bilbao Spice', '+34 944 000 000', 'hola@bilbaospice.es', 'Calle Ercilla 12, 48009 Bilbao',
 '{"mon-thu":"17:00 - 23:00","fri-sat":"13:00 - 00:00","sun":"13:00 - 23:00"}'::jsonb);

INSERT INTO public.delivery_zones (name, delivery_fee, estimated_minutes) VALUES
 ('Deusto', 2.50, 40), ('Indautxu', 1.90, 30), ('Casco Viejo', 2.20, 35), ('Abando', 1.90, 30);

INSERT INTO public.categories (slug, name_en, name_es, sort_order) VALUES
 ('starters','Starters','Entrantes',1),
 ('mains','Main Courses','Platos Principales',2),
 ('rice','Rice','Arroces',3),
 ('breads','Naan & Bread','Naan y Panes',4),
 ('combos','Combo Meals','Menús Combo',5),
 ('drinks','Drinks','Bebidas',6);

INSERT INTO public.products (category_id, slug, name_en, name_es, description_en, description_es, price, is_vegetarian, is_vegan, is_curry, tags, sort_order) VALUES
((SELECT id FROM public.categories WHERE slug='starters'),'vegetable-samosas','Vegetable Samosas (2 units)','Samosas de Verduras (2 uds.)','Crisp pastry parcels filled with spiced potatoes, peas and mild herbs, served with sweet tamarind dip.','Crujientes empanadillas rellenas de patata especiada, guisantes y hierbas suaves, con salsa dulce de tamarindo.',6.00,true,true,false,'{}',1),
((SELECT id FROM public.categories WHERE slug='starters'),'onion-bhaji','Onion Bhaji','Onion Bhaji','Ultra-crispy onion fritters made with seasoned chickpea flour.','Buñuelos de cebolla ultra crujientes con harina de garbanzo especiada.',5.50,true,true,false,'{}',2),
((SELECT id FROM public.categories WHERE slug='starters'),'chicken-pakora','Chicken Pakora','Pakora de Pollo','Tender chicken pieces coated in seasoned chickpea batter and fried until crisp.','Trozos de pollo tierno rebozados en masa de garbanzo especiada y fritos hasta quedar crujientes.',6.50,false,false,false,'{}',3),
((SELECT id FROM public.categories WHERE slug='mains'),'butter-chicken','Butter Chicken (Murgh Makhani)','Butter Chicken (Murgh Makhani)','Tandoori chicken simmered in a buttery tomato and fenugreek sauce.','Pollo tandoori cocinado en una salsa mantecosa de tomate y fenogreco.',12.50,false,false,true,'{bestseller,recommended,mild}',1),
((SELECT id FROM public.categories WHERE slug='mains'),'chicken-tikka-masala','Chicken Tikka Masala','Chicken Tikka Masala','Roasted marinated chicken cooked in aromatic tomato and onion gravy with cream.','Pollo marinado y asado en una salsa aromática de tomate y cebolla con nata.',12.00,false,false,true,'{popular}',2),
((SELECT id FROM public.categories WHERE slug='mains'),'chicken-korma','Chicken Korma','Chicken Korma','Creamy cashew, coconut and cardamom curry with zero heat.','Curry cremoso de anacardo, coco y cardamomo, sin picante.',11.50,false,false,true,'{}',3),
((SELECT id FROM public.categories WHERE slug='mains'),'lamb-rogan-josh','Lamb Rogan Josh','Cordero Rogan Josh','Slow-cooked lamb in a rich garlic, ginger and Kashmiri chilli gravy.','Cordero cocinado a fuego lento en salsa de ajo, jengibre y chile de Cachemira.',13.50,false,false,true,'{}',4),
((SELECT id FROM public.categories WHERE slug='mains'),'palak-paneer','Palak Paneer','Palak Paneer','Indian cottage cheese in creamy spinach sauce.','Queso fresco indio en salsa cremosa de espinacas.',11.00,true,false,true,'{vegetarian}',5),
((SELECT id FROM public.categories WHERE slug='mains'),'chana-masala','Chana Masala','Chana Masala','Slow-cooked chickpeas in tomato, onion and cumin masala.','Garbanzos cocinados a fuego lento en masala de tomate, cebolla y comino.',10.00,true,true,true,'{vegan}',6),
((SELECT id FROM public.categories WHERE slug='rice'),'basmati-pulao-rice','Basmati Pulao Rice','Arroz Basmati Pulao','Fragrant basmati rice tossed with whole spices.','Arroz basmati aromático salteado con especias enteras.',4.50,true,true,false,'{}',1),
((SELECT id FROM public.categories WHERE slug='breads'),'garlic-naan','Garlic Naan','Naan de Ajo','Tandoor-baked flatbread brushed with garlic and coriander butter.','Pan de tandoor con mantequilla de ajo y cilantro.',3.20,true,false,false,'{}',1),
((SELECT id FROM public.categories WHERE slug='breads'),'cheese-naan','Cheese Naan','Naan de Queso','Tandoor-baked flatbread stuffed with melting cheese.','Pan de tandoor relleno de queso fundido.',3.50,true,false,false,'{}',2),
((SELECT id FROM public.categories WHERE slug='breads'),'plain-naan','Plain Naan','Naan Natural','Soft, blistered tandoor flatbread.','Pan de tandoor suave y esponjoso.',2.80,true,false,false,'{}',3),
((SELECT id FROM public.categories WHERE slug='combos'),'bilbao-indian-box','Bilbao Indian Box','Bilbao Indian Box','One curry of your choice, one naan of your choice, basmati rice and one vegetable samosa.','Un curry a elegir, un naan a elegir, arroz basmati y una samosa de verduras.',16.90,false,false,true,'{bestseller}',1);

-- MODIFIER GROUPS
INSERT INTO public.modifier_groups (slug, name_en, name_es, min_select, max_select, is_required, sort_order) VALUES
 ('spice-level','Spice Level','Nivel de Picante',1,1,true,1),
 ('extras','Optional Extras','Extras Opcionales',0,5,false,2),
 ('combo-curry','Choose your curry','Elige tu curry',1,1,true,1),
 ('combo-bread','Choose your bread','Elige tu pan',1,1,true,2);

INSERT INTO public.modifiers (group_id, slug, name_en, name_es, price_delta, is_default, sort_order) VALUES
((SELECT id FROM public.modifier_groups WHERE slug='spice-level'),'mild','Mild (Default)','Suave (Por defecto)',0,true,1),
((SELECT id FROM public.modifier_groups WHERE slug='spice-level'),'medium','Medium','Medio',0,false,2),
((SELECT id FROM public.modifier_groups WHERE slug='spice-level'),'authentic-spicy','Authentic Spicy','Picante Auténtico',0,false,3),
((SELECT id FROM public.modifier_groups WHERE slug='extras'),'extra-chicken','Extra Chicken','Pollo Extra',3.50,false,1),
((SELECT id FROM public.modifier_groups WHERE slug='extras'),'extra-paneer','Extra Paneer','Paneer Extra',3.00,false,2),
((SELECT id FROM public.modifier_groups WHERE slug='extras'),'extra-rice','Extra Rice','Arroz Extra',2.50,false,3),
((SELECT id FROM public.modifier_groups WHERE slug='extras'),'extra-naan','Extra Naan','Naan Extra',2.80,false,4),
((SELECT id FROM public.modifier_groups WHERE slug='extras'),'extra-sauce','Extra Sauce','Salsa Extra',1.50,false,5);

INSERT INTO public.modifiers (group_id, slug, name_en, name_es, price_delta, is_default, sort_order, linked_product_id) VALUES
((SELECT id FROM public.modifier_groups WHERE slug='combo-curry'),'butter-chicken','Butter Chicken','Butter Chicken',0,true,1,(SELECT id FROM public.products WHERE slug='butter-chicken')),
((SELECT id FROM public.modifier_groups WHERE slug='combo-curry'),'chana-masala','Chana Masala','Chana Masala',0,false,2,(SELECT id FROM public.products WHERE slug='chana-masala')),
((SELECT id FROM public.modifier_groups WHERE slug='combo-bread'),'plain-naan','Plain Naan','Naan Natural',0,true,1,(SELECT id FROM public.products WHERE slug='plain-naan')),
((SELECT id FROM public.modifier_groups WHERE slug='combo-bread'),'garlic-naan','Garlic Naan','Naan de Ajo',0.40,false,2,(SELECT id FROM public.products WHERE slug='garlic-naan'));

-- attach spice + extras to curries, extras to starters/rice/breads
INSERT INTO public.product_modifier_groups (product_id, group_id, sort_order)
SELECT p.id, (SELECT id FROM public.modifier_groups WHERE slug='spice-level'), 1 FROM public.products p WHERE p.is_curry = true;
INSERT INTO public.product_modifier_groups (product_id, group_id, sort_order)
SELECT p.id, (SELECT id FROM public.modifier_groups WHERE slug='extras'), 3 FROM public.products p;
INSERT INTO public.product_modifier_groups (product_id, group_id, sort_order) VALUES
((SELECT id FROM public.products WHERE slug='bilbao-indian-box'),(SELECT id FROM public.modifier_groups WHERE slug='combo-curry'),0),
((SELECT id FROM public.products WHERE slug='bilbao-indian-box'),(SELECT id FROM public.modifier_groups WHERE slug='combo-bread'),0);
