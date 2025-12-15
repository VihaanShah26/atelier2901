import { Link } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';

export default function AtelierAbout() {
  return (
    <PageLayout>
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Our Story
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            About Us
          </h1>
        </div>

        <div className="space-y-8 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
          <p className="font-serif text-xl lg:text-2xl leading-relaxed text-foreground/90">
            At ATELIER 2901, we curate exquisite bespoke designs that epitomize individuality and sophistication.
          </p>
          
          <p className="font-light leading-relaxed text-muted-foreground">
            Founded by Payal Shah, a passionate designer with over two decades of expertise, including a distinguished tenure as an Art Director at Grey Worldwide, our studio offers an exclusive range of personalized creations.
          </p>
          
          <p className="font-light leading-relaxed text-muted-foreground">
            From custom stationery and curated gifts to bespoke coffee table books and luxury invitations, each piece is meticulously crafted to reflect the unique essence of our discerning clients.
          </p>
          
          <p className="font-serif text-xl lg:text-2xl leading-relaxed text-foreground/90 pt-4">
            Let ATELIER 2901 transform your vision into timeless elegance.
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
      </section>
    </PageLayout>
  );
}