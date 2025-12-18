import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import logoBlack from '@/assets/logo-black.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  {
    name: 'Stationery',
    path: '/stationery',
    submenu: [
      { name: 'Essential', query: 'essential' },
      { name: 'Premium', query: 'premium' },
      { name: 'Envelopes', query: 'envelopes' },
    ],
  },
  { name: 'Gifting', path: '/gifting' },
  { name: 'Coffee Table Books', path: '/coffee-table-books' },
  { name: 'Invitations', path: '/invitations' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const location = useLocation();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src={logoBlack} 
              alt="ATELIER 2901" 
              className="h-6 lg:h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;

              if (link.submenu) {
                return (
                  <DropdownMenu key={link.name}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`text-xs tracking-wider uppercase font-sans font-light transition-colors duration-200 flex items-center gap-1 ${
                          isActive
                            ? 'text-foreground border-b border-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {link.name}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {link.submenu.map((item) => (
                        <DropdownMenuItem asChild key={item.query}>
                          <Link to={`${link.path}?collection=${item.query}`} className="w-full">
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs tracking-wider uppercase font-sans font-light transition-colors duration-200 ${
                    isActive
                      ? 'text-foreground border-b border-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Cart */}
            <Link 
              to="/cart" 
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-4">
            <Link 
              to="/cart" 
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <div key={link.name}>
                <Link
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-sm tracking-wider uppercase font-sans font-light transition-colors ${
                    location.pathname === link.path
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.name}
                </Link>
                {link.submenu && (
                  <div className="mt-2 space-y-2 pl-4">
                    {link.submenu.map((item) => (
                      <Link
                        key={item.query}
                        to={`${link.path}?collection=${item.query}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
