import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowLeft, Check } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import PageLayout from '@/components/atelier/PageLayout';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { postJSON } from '@/lib/api';
import { db } from '@/lib/firebase';

export default function Cart() {
  const { toast } = useToast();
  const formatRs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, subtotal } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotice, setOrderNotice] = useState<{ status: 'idle' | 'loading' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    if (orderNotice.status === 'error') {
      setOrderNotice({ status: 'idle', message: '' });
    }
  };

  const handleCustomerEmailChange = (value: string) => {
    setCustomerEmail(value);
    if (orderNotice.status === 'error') {
      setOrderNotice({ status: 'idle', message: '' });
    }
  };

  const handleCustomerPhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (orderNotice.status === 'error') {
      setOrderNotice({ status: 'idle', message: '' });
    }
  };

  const handlePlaceOrder = async () => {
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedPhone = customerPhone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setOrderNotice({ status: 'error', message: 'Name is required.' });
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setOrderNotice({ status: 'error', message: 'Please enter a valid email.' });
      return;
    }
    if (!trimmedPhone) {
      setOrderNotice({ status: 'error', message: 'Phone number is required.' });
      return;
    }

    setOrderNotice({ status: 'loading', message: '' });

    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        items,
        subtotal,
        totalItems,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customer: {
          fullName: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        },
        createdAt: serverTimestamp(),
      });

      const emailResult = await postJSON('/api/order/confirm', {
        orderId: orderRef.id,
        customerEmail: trimmedEmail,
        customerName: trimmedName,
        customerPhone: trimmedPhone,
      });

      if (emailResult.ok) {
        toast({ description: 'Order placed. Confirmation email sent.' });
      } else {
        toast({ description: 'Order placed, but confirmation email may be delayed.' });
      }

      setOrderNotice({ status: 'idle', message: '' });
      setOrderPlaced(true);
      clearCart();
    } catch {
      setOrderNotice({
        status: 'error',
        message: 'Something went wrong while placing the order. Please try again.',
      });
    }
  };

  if (orderPlaced) {
    return (
      <PageLayout>
        <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 text-center">
          <div className="animate-fade-in opacity-0">
            <div className="w-16 h-16 mx-auto mb-8 border border-accent flex items-center justify-center">
              <Check className="w-8 h-8 text-accent" strokeWidth={1.5} />
            </div>
            <h1 className="font-sans text-3xl md:text-4xl mb-4">
              Thank you
            </h1>
            <p className="text-muted-foreground font-light mb-8">
              We'll reach out to confirm details.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Continue browsing
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PageLayout>
        <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 text-center">
          <div className="animate-fade-in opacity-0">
            <h1 className="font-sans text-3xl md:text-4xl mb-4">
              Your cart is currently empty.
            </h1>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors mt-8"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Continue browsing
            </Link>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="max-w-4xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="mb-12 lg:mb-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light animate-fade-in opacity-0">
            Your Selection
          </p>
          <h1 className="font-sans text-3xl md:text-4xl lg:text-3xl animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
            Cart ({totalItems})
          </h1>
        </div>

        {/* Cart Items */}
        <div className="space-y-0 mb-12">
          {items.map((item, index) => (
            <div 
              key={`${item.id}-${item.personalize}-${item.greeting ?? 'none'}-${item.personalizationName ?? 'none'}-${item.initials ?? 'none'}`}
              className="flex flex-col items-start gap-4 py-6 border-b border-border animate-fade-in opacity-0 md:flex-row md:items-center md:gap-6"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 flex-shrink-0 bg-muted">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 w-full">
                <h3 className="font-sans text-2l truncate">{item.name}</h3>
                {/* <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                  Personalized: {item.personalize === 'yes' ? 'Yes' : 'No'}
                </p> */}
                {item.greeting !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Greeting: {item.greeting}
                  </p>
                )}
                {item.personalizationName !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Name: {item.personalizationName}
                  </p>
                )}
                {item.initials !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Initials: {item.initials}
                  </p>
                )}
                {item.price !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Price: {formatRs(item.price * item.quantity)}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    updateQuantity(
                      item.id,
                      item.personalize,
                      item.greeting,
                      item.personalizationName,
                      item.initials,
                      item.quantity - 1
                    )
                  }
                  className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" strokeWidth={1.5} />
                </button>
                <span className="w-8 text-center font-light text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(
                      item.id,
                      item.personalize,
                      item.greeting,
                      item.personalizationName,
                      item.initials,
                      item.quantity + 1
                    )
                  }
                  className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() =>
                  removeFromCart(
                    item.id,
                    item.personalize,
                    item.greeting,
                    item.personalizationName,
                    item.initials
                  )
                }
                className="text-muted-foreground hover:text-foreground transition-colors self-end order-first md:order-none md:self-auto"
                aria-label="Remove item"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border-t border-border pt-8 animate-fade-in opacity-0" style={{ animationDelay: '400ms' }}>
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-light">
              Subtotal
            </span>
            <span className="font-sans text-lg">
              {formatRs(subtotal)}
            </span>
          </div>

          <div className="space-y-6 mb-8">
            {orderNotice.status === 'error' && (
              <div className="border border-red-200 bg-red-50/60 text-red-800 px-4 py-3 text-sm font-light">
                {orderNotice.message}
              </div>
            )}
            <div>
              <label htmlFor="order-name" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                Name
              </label>
              <input
                id="order-name"
                type="text"
                value={customerName}
                onChange={(event) => handleCustomerNameChange(event.target.value)}
                className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label htmlFor="order-email" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                Email
              </label>
              <input
                id="order-email"
                type="email"
                value={customerEmail}
                onChange={(event) => handleCustomerEmailChange(event.target.value)}
                className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label htmlFor="order-phone" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                Phone
              </label>
              <input
                id="order-phone"
                type="tel"
                value={customerPhone}
                onChange={(event) => handleCustomerPhoneChange(event.target.value)}
                className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={orderNotice.status === 'loading'}
            className="w-full py-4 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {orderNotice.status === 'loading' ? 'Placing order...' : 'Checkout'}
          </button>
          
          <p className="text-center text-xs text-muted-foreground mt-4 font-light">
            We'll confirm details and pricing via email.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
