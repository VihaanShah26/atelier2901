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
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative px-6 lg:px-12 py-10 overflow-hidden">
        <div className="absolute inset-0">
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
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-80px)] items-center justify-center md:justify-end">
          <div className="max-w-2xl text-center md:text-right text-white">
            <h1 className="font-sans text-xl sm:text-2xl md:text-4xl lg:text-5xl leading-tight animate-fade-in opacity-0">
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
                cursorCharacter="|"
              />
            </h1>
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
