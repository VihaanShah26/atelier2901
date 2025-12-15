import { useState } from 'react';
import { Instagram, Mail, Send } from 'lucide-react';
import PageLayout from '@/components/atelier/PageLayout';
import { useToast } from '@/hooks/use-toast';

export default function AtelierContact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: "Thank you",
      description: "We'll be in touch soon.",
    });
    
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <PageLayout>
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Get in Touch
          </p>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            Contact
          </h1>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 mb-16 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
          <a 
            href="mailto:payal.shah@atelier2901.com"
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Mail className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-light">payal.shah@atelier2901.com</span>
          </a>
          <a 
            href="https://instagram.com/atelier_2901"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <Instagram className="w-5 h-5" strokeWidth={1.5} />
            <span className="font-light">@atelier_2901</span>
          </a>
        </div>

        {/* Divider */}
        <div className="divider mb-16" />

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
              className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 py-4 px-8 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <span>Send Message</span>
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </form>
      </section>
    </PageLayout>
  );
}