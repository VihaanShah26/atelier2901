import { useState } from 'react';
import { Instagram, Mail, Send } from 'lucide-react';
import PageLayout from '@/components/atelier/PageLayout';
import { postJSON } from '@/lib/api';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function AtelierContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    phone: '',
    companyWebsite: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (status === 'error') {
      setStatus('idle');
      setStatusMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.companyWebsite.trim()) {
      setIsSubmitting(false);
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();
    const trimmedPhone = formData.phone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setStatus('error');
      setStatusMessage('Name is required.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setStatus('error');
      setStatusMessage('Please enter a valid email.');
      return;
    }
    if (trimmedMessage.length < 10) {
      setStatus('error');
      setStatusMessage('Message should be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    setStatus('loading');
    setStatusMessage('');

    const result = await postJSON('/api/contact', {
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      phone: trimmedPhone || undefined,
      source: 'atelier2901.com',
    });

    if (result.ok) {
      setStatus('success');
      setStatusMessage('Message sent.');
      setFormData({ name: '', email: '', message: '', phone: '', companyWebsite: '' });
      setIsSubmitting(false);
      return;
    }

    if (result.status === 400) {
      setStatus('error');
      setStatusMessage(result.message || 'Please check your inputs and try again.');
    } else if (result.status === 429) {
      setStatus('error');
      setStatusMessage('Too many requests. Please try again in a few minutes.');
    } else {
      setStatus('error');
      setStatusMessage('Something went wrong while sending. Please try again.');
    }

    setIsSubmitting(false);
  };

  return (
    <PageLayout>
      <section className="max-w-3xl min-h-[100vh] mx-auto px-6 lg:px-12 py-16 lg:py-16">
        <div className="mb-8 lg:mb-8">
          <h1 className="font-sans md:text-2xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            Contact Us 
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
        {/* <div className="divider mb-16" /> */}

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
          {(status === 'success' || status === 'error') && (
            <div
              className={`border px-4 py-3 text-sm font-light ${
                status === 'success'
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                  : 'border-red-200 bg-red-50/60 text-red-800'
              }`}
            >
              {statusMessage}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
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
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
              Phone (optional)
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
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
              onChange={(e) => updateField('message', e.target.value)}
              required
              className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>

          <input
            type="text"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={(e) => updateField('companyWebsite', e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 py-4 px-8 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </form>
      </section>
    </PageLayout>
  );
}
