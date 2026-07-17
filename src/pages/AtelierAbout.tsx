import { Link } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';

export default function AtelierAbout() {
  return (
    <PageLayout>
      <section className="min-h-[100vh] px-6 py-16 lg:px-0 lg:py-0">
        <div className="grid gap-y-12 lg:grid-cols-[30vw_minmax(0,1fr)] lg:items-start">
          <div className="-mx-6 flex justify-center animate-fade-in opacity-0 lg:sticky lg:top-20 lg:mx-0 lg:h-[calc(100vh-5rem)] lg:w-[30vw]" style={{ animationDelay: '100ms' }}>
            <div className="w-full overflow-hidden bg-muted lg:h-full">
              <img
                src="/payal.jpeg"
                alt="Payal Shah"
                className="w-full object-cover lg:h-full"
              />
            </div>
          </div>

          <div className="lg:max-w-5xl lg:px-16 lg:py-16">
            <div className="mb-8 lg:mb-8">
              <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
                About Us 
              </h1>
            </div>

            <div className="mt-2 space-y-6 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
              <p className="font-light leading-relaxed text-muted-foreground">
                At ATELIER 2901, we curate exquisite bespoke designs that celebrate individuality, elegance, and refined craftsmanship.
              </p>
              
              <p className="font-light leading-relaxed text-muted-foreground">
                Founded by Payal Shah, an accomplished designer driven by a passion for timeless aesthetics, impeccable detail, and meaningful storytelling, the studio reflects her belief that great design is both personal and enduring.
              </p>
              
              <p className="font-light leading-relaxed text-muted-foreground">
                With over two decades of design experience, Payal spent more than eleven years as an Art Director at one of the world's leading advertising agencies, creating work for iconic national and international brands. Having mastered the art of visual storytelling for global names, she chose to pursue a more personal creative path, founding ATELIER 2901 to craft bespoke pieces that celebrate individual stories, milestones, and memories.
              </p>

              <p className="font-light leading-relaxed text-muted-foreground">
                For Payal, design is not just a craft—it is a way of noticing beauty, telling stories, and creating pieces that are both meaningful and timeless. Today, ATELIER 2901 creates bespoke stationery, luxury invitations, curated gifting, personalized coffee table books, and bespoke creations that celebrate life's most meaningful moments. Every piece is thoughtfully designed and meticulously crafted to reflect the unique personality, style, and story of each client.
              </p>
              
              <p className="font-light leading-relaxed text-muted-foreground">
                At ATELIER 2901, every detail is intentional, every creation is personal, and every design is crafted to become a timeless keepsake.
              </p>
            </div>

            {/* Divider */}
            <div className="divider my-16" />

            {/* Contact Link */}
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
              <Link 
                to="/contact"
                className="inline-flex items-center text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors"
              >
                Get in touch →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
