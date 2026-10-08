import { Instagram, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const policyLinks = [
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Returns & Refunds', path: '/return-and-refund-policy' },
  { label: 'Shipping & Delivery', path: '/shipping-and-delivery-policy' },
  { label: 'Terms & Conditions', path: '/terms-and-conditions' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
        <div className="grid gap-8 md:grid-cols-3 md:gap-8">
          {/* Contact */}
          <div className="space-y-3">
            <Link
              to="/contact"
              className="inline-flex text-xs uppercase tracking-widest font-light text-foreground hover:text-muted-foreground transition-colors"
            >
              Contact
            </Link>

            <div className="space-y-2">
            <a 
              href="mailto:hello@atelier2901.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-light">hello@atelier2901.com</span>
            </a>
            <a 
              href="https://instagram.com/atelier_2901"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-light">atelier_2901</span>
            </a>
            </div>
          </div>

          <nav aria-label="Policies" className="space-y-3 md:text-left">
            <p className="text-xs uppercase tracking-widest font-light text-foreground">
              Policies
            </p>

            <div className="flex flex-col gap-2 md:items-start">
              {policyLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-light"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-xs text-muted-foreground font-light tracking-wider">
              © {new Date().getFullYear()} ATELIER 2901. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
