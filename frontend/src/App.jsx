import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import CheckoutSuccess from "@/pages/CheckoutSuccess";

import AdminLogin from "@/pages/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminSiteContent from "@/pages/admin/AdminSiteContent";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>

        <Routes>

          {/* PUBLIC ROUTES */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/cart" element={<Shop />} />
          </Route>

          {/* ADMIN LOGIN */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ADMIN DASHBOARD */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="content" element={<AdminSiteContent />} />
          </Route>

        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(300, 56%, 19%)",
              color: "#fff",
              borderRadius: "4px",
              fontSize: "14px",
            },
          }}
        />

      </CartProvider>
    </AuthProvider>
  );
}
