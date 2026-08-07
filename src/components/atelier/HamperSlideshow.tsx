import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/hooks/useProducts';
import { useImagePreloader } from '@/hooks/useImagePreloader';

interface HamperSlideshowProps {
  title: string;
  products: Product[];
  loading: boolean;
  error: string | null;
  showImageName?: boolean;
  description?: string;
  prefetchPriority?: number;
}

type Slide = {
  id: string;
  name: string;
  image: string;
};

export default function HamperSlideshow({ title, products, loading, error, showImageName = true, description = '', prefetchPriority = 2 }: HamperSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo<Slide[]>(
    () =>
      products.flatMap((product) => {
        const images = product.images.length ? product.images : [product.img].filter(Boolean);
        return images.map((image, index) => ({
          id: `${product.id}-${index}`,
          name: '',
          image,
        }));
      }),
    [products],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  const imageStatus = useImagePreloader(slides.map((slide) => slide.image), prefetchPriority);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (loading || !imageStatus.isLoaded) {
    return (
      <section className="grid min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-background lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[40%_60%]" style={{ animationDelay: '100ms' }}>
        <div className="flex min-h-[40vh] items-center px-6 py-16 text-left lg:min-h-[calc(100vh-5rem)] lg:pl-[max(3rem,calc((100vw-1280px)/2+3rem))] lg:pr-8">
          <div className="max-w-sm space-y-4">
            <div className="h-4 w-32 rounded-full bg-muted animate-pulse" />
            <div className="h-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-3">
              <div className="h-3 rounded-full bg-muted w-5/6 animate-pulse" />
              <div className="h-3 rounded-full bg-muted w-2/3 animate-pulse" />
              <div className="h-3 rounded-full bg-muted w-3/4 animate-pulse" />
              <div className="h-3 rounded-full bg-muted w-1/2 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="relative min-h-[60vh] overflow-hidden bg-muted lg:min-h-[calc(100vh-5rem)]">
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <div className="rounded-full bg-muted p-6 shadow-lg shadow-black/10 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-background" />
            </div>
            <div className="mt-6 text-sm uppercase tracking-widest text-muted-foreground font-light">
              Loading gallery...
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted lg:min-h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground font-light">{error}</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted lg:min-h-[calc(100vh-5rem)]">
        <p className="text-muted-foreground font-light">No images yet.</p>
      </div>
    );
  }

  const activeSlide = slides[activeIndex];

  const showPrevious = () => {
    setActiveIndex((index) => (index === 0 ? slides.length - 1 : index - 1));
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % slides.length);
  };

  return (
    <section className="grid min-h-[calc(100vh-4rem)] w-full animate-fade-in overflow-hidden bg-background opacity-0 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[40%_60%]" style={{ animationDelay: '100ms' }}>
      <div className="flex min-h-[40vh] items-end px-6 py-16 text-left lg:min-h-[calc(100vh-5rem)] lg:pl-[max(3rem,calc((100vw-1280px)/2+3rem))] lg:pr-8">
        <div className="max-w-sm">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-light">
            Collection
          </p>
          <h1 className="font-sans md:text-2xl lg:text-3xl">
            {title}
          </h1>
          <p className="mt-2 font-light text-muted-foreground" style={{ whiteSpace: 'pre-line' }}>
            {description || 'Curated exclusively for you.'}
          </p>
          <Link
            to="/contact"
            className="get-in-touch-button mt-4 inline-flex items-center justify-center border border-border px-6 py-3 text-xs uppercase tracking-widest font-light text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Get in touch
          </Link>
        </div>
      </div>

      <div className="relative min-h-[60vh] overflow-hidden bg-background lg:min-h-[calc(100vh-5rem)]">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.image}
            alt={slide.name}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {showImageName && activeSlide.name && (
          <div className="absolute inset-x-0 bottom-12 z-10 flex justify-center px-6 text-center">
            <h2 className="font-sans text-2xl text-white drop-shadow-md md:text-3xl">
              {activeSlide.name}
            </h2>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
