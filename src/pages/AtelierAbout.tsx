import { Link } from 'react-router-dom';
import PageLayout from '@/components/atelier/PageLayout';

export default function AtelierAbout() {
  return (
    <PageLayout>
      <section className="max-w-3xl min-h-[100vh] mx-auto px-6 lg:px-12 py-16 lg:py-16">
        <div className="mb-8 lg:mb-8">
          <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            About Us 
          </h1>
        </div>

        <div className="mt-2 space-y-6 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
          <p className="font-light leading-relaxed text-muted-foreground">
            At ATELIER 2901, we curate exquisite bespoke designs that epitomize individuality and sophistication.
          </p>
          
          <p className="font-light leading-relaxed text-muted-foreground">
            Founded by Payal Shah, a passionate designer with over two decades of expertise, including a distinguished tenure as an Art Director at Grey Worldwide, our studio offers an exclusive range of personalized creations.
          </p>
          
          <p className="font-light leading-relaxed text-muted-foreground">
            From custom stationery and curated gifts to bespoke coffee table books and luxury invitations, each piece is meticulously crafted to reflect the unique essence of our discerning clients.
          </p>
          
          <p className="font-light leading-relaxed text-muted-foreground">
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