import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const formatRs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;
  const [quantity, setQuantity] = useState(1);
  const [personalize, setPersonalize] = useState<'yes' | 'no'>('no');
  const [goldFoil, setGoldFoil] = useState<'yes' | 'no'>('no');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [greetingOption, setGreetingOption] = useState('No Greeting');
  const [customGreeting, setCustomGreeting] = useState('');
  const [personalizationName, setPersonalizationName] = useState('');
  const [initials, setInitials] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const { addToCart } = useCart();
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const displayName = product.name || 'ATELIER 2901';
  const isCoffeeTableBook = product.category === 'coffeetablebooks';
  const isInvitation = product.category === 'invitations';
  const isInquiryOnly = isCoffeeTableBook || isInvitation;
  const isStationeryProduct = [
    'stationery_essential',
    'stationery_premium',
    'stationery_money',
  ].includes(product.category);
  const isStationeryEssential = product.category === 'stationery_essential';
  const isStationeryPremium = product.category === 'stationery_premium';
  const supportsGoldFoil = isStationeryPremium || (product.category === 'stationery_money' && product.goldFoil === true);
  const isGiftingTravel = product.category === 'gifting_travel';
  const isGiftingProduct = isGiftingTravel || product.category === 'gifting_coasters' || product.category === 'gifting_wine';
  const effectivePersonalize = isGiftingProduct ? 'no' : personalize;
  const sizeOptions = Array.isArray(product.sizes) ? product.sizes : [];
  const selectedSizeOption = sizeOptions.find((size) => size.label === selectedSize) || sizeOptions[0];
  const showSizeSelector = sizeOptions.length > 1;
  const stationeryBasePrice = product.price ?? 1900;
  const stationeryPersonalizedPrice = product.personalizedPrice ?? 2200;
  const giftingPrice = product.price ?? 2000;
  const goldFoilPrice = supportsGoldFoil && goldFoil === 'yes' ? 300 : 0;
  const baseResolvedPrice = sizeOptions.length
    ? effectivePersonalize === 'yes'
      ? selectedSizeOption?.personalizedPrice ?? selectedSizeOption?.price ?? null
      : selectedSizeOption?.price ?? null
    : isStationeryProduct
      ? effectivePersonalize === 'yes'
        ? stationeryPersonalizedPrice
        : stationeryBasePrice
      : product.price ?? (isGiftingProduct ? giftingPrice : null);
  const resolvedPrice = baseResolvedPrice === null ? null : baseResolvedPrice + goldFoilPrice;
  const productImages = product.images.length ? product.images : [product.img].filter(Boolean);
  const selectedImage = productImages[selectedImageIndex] || productImages[0] || '';
  const greetingValue =
    isStationeryProduct && effectivePersonalize === 'yes'
      ? greetingOption === 'No Greeting'
        ? ''
        : greetingOption === 'Custom Greeting'
          ? customGreeting.trim().slice(0, 35)
          : greetingOption
      : null;
  const nameValue =
    isStationeryProduct && effectivePersonalize === 'yes'
      ? personalizationName.trim() || null
      : null;
  const initialsValue = isGiftingTravel ? initials.trim().slice(0, 6) || null : null;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    modalRef.current?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (sizeOptions.length) {
      setSelectedSize(sizeOptions[0].label);
    } else {
      setSelectedSize('');
    }
  }, [product.id, sizeOptions.length]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setGoldFoil('no');
  }, [product.id]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = () => {
    if (isInquiryOnly) return;
    addToCart({
      id: product.id,
      name: displayName,
      img: product.img,
      category: product.category,
      personalize: effectivePersonalize,
      goldFoil: supportsGoldFoil ? goldFoil : null,
      price: resolvedPrice ?? null,
      greeting: greetingValue,
      personalizationName: nameValue,
      initials: initialsValue,
      size: selectedSizeOption?.label ?? null,
    }, quantity);
    
    toast({
      description: "Added to cart.",
    });
    
    onClose();
  };

  return (
    <div 
      className="modal-overlay flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-background max-w-2xl w-full h-[70vh] overflow-hidden animate-scale-in"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-foreground/60 hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="grid h-full md:grid-cols-2 gap-0 md:items-stretch">
          {/* Image */}
          <div className="relative bg-muted md:h-full">
            {selectedImage && (
              <img
                src={selectedImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            )}
            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === 0 ? productImages.length - 1 : index - 1
                    )
                  }
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === productImages.length - 1 ? 0 : index + 1
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col justify-start h-full overflow-y-auto min-h-0">
            <h2 className="font-sans text-2xl lg:text-3xl mb-8">
              {displayName}
            </h2>

            {isInquiryOnly ? (
              <div>
                <p className="text-sm text-muted-foreground font-light">
                  {isInvitation
                    ? 'Invitations that reflect your story, style, and occasion. Connect with us to create yours'
                    : 'Each book is uniquely crafted. Connect with us to create yours.'}
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex items-center justify-center border border-border px-4 py-2 text-xs uppercase tracking-widest font-light text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  Contact us
                </Link>
              </div>
            ) : (
              <>
                {/* Quantity Selector */}
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                    Quantity
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <span className="w-12 text-center font-light">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {(isStationeryEssential || isStationeryPremium) && (
                  <p className="text-xs text-muted-foreground font-light mb-8">
                    Each set contains 15 gift cards, 15 gift tags and 15 envelopes
                  </p>
                )}

                {(isGiftingTravel) && (
                  <p className="text-xs text-muted-foreground font-light mb-8">
                    Made with vegan leather and brass detailing. 
                  </p>
                )}

                {showSizeSelector && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Size
                    </p>
                    <select
                      value={selectedSize}
                      onChange={(event) => setSelectedSize(event.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    >
                      {sizeOptions.map((size) => (
                        <option key={size.label} value={size.label}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isGiftingProduct && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Do you wish to personalize this?
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="personalize"
                          value="yes"
                          checked={personalize === 'yes'}
                          onChange={() => setPersonalize('yes')}
                          className="h-4 w-4 accent-foreground"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="personalize"
                          value="no"
                          checked={personalize === 'no'}
                          onChange={() => setPersonalize('no')}
                          className="h-4 w-4 accent-foreground"
                        />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {supportsGoldFoil && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Do you want gold foil?
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="goldFoil"
                          value="yes"
                          checked={goldFoil === 'yes'}
                          onChange={() => setGoldFoil('yes')}
                          className="h-4 w-4 accent-foreground"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="goldFoil"
                          value="no"
                          checked={goldFoil === 'no'}
                          onChange={() => setGoldFoil('no')}
                          className="h-4 w-4 accent-foreground"
                        />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {isGiftingTravel && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Initials
                    </p>
                    <input
                      type="text"
                      value={initials}
                      onChange={(event) => setInitials(event.target.value)}
                      maxLength={6}
                      placeholder="Enter initials"
                      className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </div>
                )}

                {isStationeryProduct && effectivePersonalize === 'yes' && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Greeting
                    </p>
                    <div className="flex flex-col gap-4">
                      <select
                        value={greetingOption}
                        onChange={(event) => setGreetingOption(event.target.value)}
                        className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      >
                        <option value="With Love">With Love</option>
                        <option value="Best Wishes">Best Wishes</option>
                        <option value="Love and Happiness">Love and Happiness</option>
                        <option value="No Greeting">No Greeting</option>
                        <option value="Custom Greeting">Custom Greeting</option>
                      </select>
                      {greetingOption === 'Custom Greeting' && (
                        <input
                          type="text"
                          value={customGreeting}
                          onChange={(event) => setCustomGreeting(event.target.value)}
                          maxLength={35}
                          placeholder="Enter greeting (max 35 characters)"
                          className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                        />
                      )}
                    </div>
                  </div>
                )}

                {isStationeryProduct && effectivePersonalize === 'yes' && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Name
                    </p>
                    <input
                      type="text"
                      value={personalizationName}
                      onChange={(event) => setPersonalizationName(event.target.value)}
                      placeholder="Enter name"
                      className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </div>
                )}

                {(isStationeryProduct || isGiftingProduct || sizeOptions.length) && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Price
                    </p>
                    <p className="text-sm font-light text-foreground/80">
                      {formatRs(resolvedPrice ?? 0)}
                    </p>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors"
                >
                  Add to cart
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
