import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowLeft, Check } from 'lucide-react';
import PageLayout from '@/components/atelier/PageLayout';
import { useCart } from '@/contexts/CartContext';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <PageLayout>
        <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 text-center">
          <div className="animate-fade-in opacity-0">
            <div className="w-16 h-16 mx-auto mb-8 border border-accent flex items-center justify-center">
              <Check className="w-8 h-8 text-accent" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mb-4">
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
            <h1 className="font-serif text-3xl md:text-4xl mb-4">
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
              key={item.id}
              className="flex items-center gap-6 py-6 border-b border-border animate-fade-in opacity-0"
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
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-2l truncate">{item.name}</h3>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" strokeWidth={1.5} />
                </button>
                <span className="w-8 text-center font-light text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
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
            <span className="font-serif text-lg">
              Price on request
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="w-full py-4 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors"
          >
            Place Request
          </button>
          
          <p className="text-center text-xs text-muted-foreground mt-4 font-light">
            We'll confirm details and pricing via email.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}