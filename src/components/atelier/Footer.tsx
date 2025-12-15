import { Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Contact */}
          <div className="flex items-center gap-6">
            <a 
              href="mailto:payal.shah@atelier2901.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-light">payal.shah@atelier2901.com</span>
            </a>
            <a 
              href="https://instagram.com/atelier2901"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-light">atelier2901</span>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground font-light tracking-wider">
            © {new Date().getFullYear()} ATELIER 2901. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}