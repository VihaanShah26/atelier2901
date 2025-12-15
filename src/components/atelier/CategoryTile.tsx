import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface CategoryTileProps {
  title: string;
  path: string;
  delay?: number;
}

export default function CategoryTile({ title, path, delay = 0 }: CategoryTileProps) {
  return (
    <Link
      to={path}
      className="group block border border-border p-8 lg:p-12 transition-all duration-300 hover:border-foreground/30 animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl lg:text-2xl text-foreground/80 group-hover:text-foreground transition-colors">
          {title}
        </h3>
        <ArrowRight 
          className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" 
          strokeWidth={1.5} 
        />
      </div>
    </Link>
  );
}