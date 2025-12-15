import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Home from "./pages/Home";
import Stationery from "./pages/Stationery";
import Gifting from "./pages/Gifting";
import CoffeeTableBooks from "./pages/CoffeeTableBooks";
import Invitations from "./pages/Invitations";
import AtelierAbout from "./pages/AtelierAbout";
import AtelierContact from "./pages/AtelierContact";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stationery" element={<Stationery />} />
              <Route path="/gifting" element={<Gifting />} />
              <Route path="/coffee-table-books" element={<CoffeeTableBooks />} />
              <Route path="/invitations" element={<Invitations />} />
              <Route path="/about" element={<AtelierAbout />} />
              <Route path="/contact" element={<AtelierContact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
