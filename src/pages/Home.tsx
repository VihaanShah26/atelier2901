import { Link } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';
import CategoryTile from '@/components/atelier/CategoryTile';
import logoBlack from '@/assets/logo-black.png';

const categories = [
  { title: 'Bespoke Stationery', path: '/stationery' },
  { title: 'Gifting', path: '/gifting' },
  { title: 'Coffee Table Books', path: '/coffee-table-books' },
  { title: 'Invitations', path: '/invitations' },
  { title: 'About / Contact', path: '/about' },
];

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="min-h-[87vh] flex flex-col items-center justify-center px-6 lg:px-12 py-20">
        <div className="max-w-3xl text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 animate-fade-in opacity-0">
            Bespoke design, curated with restraint.
          </h1>
          <p className="text-muted-foreground font-light text-lg lg:text-xl max-w-xl mx-auto animate-fade-in opacity-0" style={{ animationDelay: '150ms' }}>
            Exquisite creations that epitomize individuality and sophistication.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="divider max-w-7xl mx-auto" />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-10 font-light">
          Explore
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <CategoryTile 
              key={category.path}
              title={category.title}
              path={category.path}
              delay={index * 100}
            />
          ))}
        </div>
      </section>
    </PageLayout>
  );
}