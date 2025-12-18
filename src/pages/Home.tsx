import { useEffect, useState } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import CategoryTile from '@/components/atelier/CategoryTile';
import TextType from '@/components/atelier/TextType';

const categories = [
  { title: 'Stationery', path: '/stationery' },
  { title: 'Gifting', path: '/gifting' },
  { title: 'Coffee Table Books', path: '/coffee-table-books' },
  { title: 'Invitations', path: '/invitations' },
  { title: 'About / Contact', path: '/about' },
];

const heroImages = [
  'src/assets/blog-minimalist-living.jpg',
  'src/assets/blog-sustainable-architecture.jpg',
  'src/assets/blog-urban-planning.jpg',
  'src/assets/hero-architecture.jpg',
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section
        className="min-h-[100vh] flex flex-col-reverse md:flex-row md:items-center gap-10 px-6 lg:px-12 py-20"
        style={{ background: 'rgba(184, 206, 28, 0.9)' }}
      >
        <div className="w-full md:w-1/2">
          <h1 className="font-sans text-xl sm:text-2xl md:text-4xl lg:text-4xl leading-tight mb-6 animate-fade-in opacity-0 text-left">
            <TextType
              text={[
                'Luxury stationery. Elevated gifting. Designed for you.',
                'Bespoke design, thoughtfully crafted.',
                "Tailored designs for life's most meaningful moments.",
                'Where craftsmanship, creativity, and personalization converge.',
                'Quiet luxury, designed with purpose.',
              ]}
              typingSpeed={65}
              pauseDuration={1700}
              deletingSpeed={30}
              showCursor
              cursorCharacter="_"
            />
          </h1>
        </div>
        <div className="w-full md:w-1/2">
          <div className="relative w-full h-80 sm:h-96 md:h-[520px] overflow-hidden rounded-2xl shadow-2xl">
            {heroImages.map((image, index) => (
              <div
                key={image}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ backgroundImage: `url(${image})` }}
                aria-hidden="true"
              />
            ))}
          </div>
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
