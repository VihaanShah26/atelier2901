import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/hooks/useProducts';
import { PersonalizationDetail, useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const formatRs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;
  const resolveGreeting = (option: string, custom: string) =>
    option === 'No Greeting'
      ? ''
      : option === 'Custom Greeting'
        ? custom.trim().slice(0, 35)
        : option;
  const [quantity, setQuantity] = useState(1);
  const [personalize, setPersonalize] = useState<'yes' | 'no'>('no');
  const [goldFoil, setGoldFoil] = useState<'yes' | 'no'>('no');
  const [goldFoilPrompt, setGoldFoilPrompt] = useState<'select' | 'decrease' | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [greetingOption, setGreetingOption] = useState('No Greeting');
  const [customGreeting, setCustomGreeting] = useState('');
  const [personalizationName, setPersonalizationName] = useState('');
  const [samePersonalizationForAll, setSamePersonalizationForAll] = useState(true);
  const [additionalPersonalizations, setAdditionalPersonalizations] = useState<
    Record<number, { greetingOption: string; customGreeting: string; name: string }>
  >({});
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
  const modalSubtitle = product.subtitle?.trim() ||  product.description?.trim() || '';
  const effectivePersonalize = isGiftingProduct ? 'no' : personalize;
  const sizeOptions = Array.isArray(product.sizes) ? product.sizes : [];
  const selectedSizeOption = sizeOptions.find((size) => size.label === selectedSize) || sizeOptions[0];
  const showSizeSelector = sizeOptions.length > 1;
  const stationeryBasePrice = product.price ?? 1900;
  const stationeryPersonalizedPrice = product.personalizedPrice ?? 2200;
  const giftingPrice = product.price ?? 2000;
  const goldFoilPrice = supportsGoldFoil && goldFoil === 'yes' ? product.category === 'stationery_money' ? 1000 : 600 : 0;
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
      ? resolveGreeting(greetingOption, customGreeting)
      : null;
  const nameValue =
    isStationeryProduct && effectivePersonalize === 'yes'
      ? personalizationName.trim() || null
      : null;
  const initialsValue = isGiftingTravel ? initials.trim().slice(0, 2) || null : null;
  const personalizationDetails: PersonalizationDetail[] =
    isStationeryProduct && effectivePersonalize === 'yes'
      ? Array.from({ length: quantity }, (_, index) => {
          const set = index + 1;
          const detail =
            set === 1 || samePersonalizationForAll
              ? {
                  greeting: greetingValue,
                  name: nameValue,
                }
              : {
                  greeting: resolveGreeting(
                    additionalPersonalizations[set]?.greetingOption ?? 'No Greeting',
                    additionalPersonalizations[set]?.customGreeting ?? ''
                  ),
                  name: additionalPersonalizations[set]?.name.trim() || null,
                };
          return {
            set,
            greeting: detail.greeting || null,
            name: detail.name,
          };
        })
      : [];

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
    setGoldFoilPrompt(null);
    setSamePersonalizationForAll(true);
    setAdditionalPersonalizations({});
  }, [product.id]);

  useEffect(() => {
    if (quantity <= 1) {
      setSamePersonalizationForAll(true);
    }
  }, [quantity]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGoldFoilYes = () => {
    if (quantity < 2) {
      setGoldFoilPrompt('select');
      return;
    }
    setGoldFoil('yes');
  };

  const handleGoldFoilCancel = () => {
    setGoldFoil('no');
    if (goldFoilPrompt === 'decrease') {
      setQuantity(1);
    }
    setGoldFoilPrompt(null);
  };

  const handleGoldFoilMinimum = () => {
    setQuantity(2);
    setGoldFoil('yes');
    setGoldFoilPrompt(null);
  };

  const handleDecreaseQuantity = () => {
    if (goldFoil === 'yes' && quantity <= 2) {
      setGoldFoilPrompt('decrease');
      return;
    }
    setQuantity(Math.max(1, quantity - 1));
  };

  const updateAdditionalPersonalization = (
    set: number,
    field: 'greetingOption' | 'customGreeting' | 'name',
    value: string
  ) => {
    setAdditionalPersonalizations((prev) => ({
      ...prev,
      [set]: {
        greetingOption: prev[set]?.greetingOption ?? 'No Greeting',
        customGreeting: prev[set]?.customGreeting ?? '',
        name: prev[set]?.name ?? '',
        [field]: value,
      },
    }));
  };

  const handleAddToCart = () => {
    if (isInquiryOnly) return;
    if (goldFoil === 'yes' && quantity < 2) {
      setGoldFoilPrompt('select');
      return;
    }
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
      personalizationDetails,
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
        className="relative bg-background max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-scale-in md:h-[70vh] md:overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-foreground/60 hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {goldFoilPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/20 px-6">
            <div className="w-full max-w-sm border border-border bg-background p-6 shadow-elegant">
              <h3 className="font-sans text-xl mb-3">Minimum quantity</h3>
              <p className="text-sm font-light text-muted-foreground mb-6">
                Gold foil requires a minimum quantity of 2. Please cancel gold foil or use quantity 2.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGoldFoilCancel}
                  className="flex-1 border border-border px-4 py-3 text-xs uppercase tracking-widest font-light text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
                >
                  Cancel gold foil
                </button>
                <button
                  type="button"
                  onClick={handleGoldFoilMinimum}
                  className="flex-1 bg-foreground px-4 py-3 text-xs uppercase tracking-widest font-light text-background hover:bg-foreground/90 transition-colors"
                >
                  Use quantity 2
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:h-full md:grid-cols-2 gap-0 md:items-stretch">
          {/* Image */}
          <div className="relative aspect-square bg-muted md:aspect-auto md:h-full">
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
                  className="image-nav-button absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
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
                  className="image-nav-button absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground/80 transition-colors hover:text-foreground"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>

          {/* Details */}
          <div className="p-8 flex flex-col justify-start min-h-0 md:h-full md:overflow-y-auto">
            <h2 className="font-sans text-2xl lg:text-3xl mb-8">
              {displayName}
            </h2>

            {isInquiryOnly ? (
              <div>
                <p className="text-sm text-muted-foreground font-light">
                  {modalSubtitle}
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
                      onClick={handleDecreaseQuantity}
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

                {modalSubtitle && (
                  <p className="text-xs text-muted-foreground font-light mb-8">
                    {modalSubtitle}
                  </p>
                )}

                {(isStationeryEssential || isStationeryPremium) && (
                  <p className="text-xs text-muted-foreground font-light mb-8">
                    Each set contains 15 gift cards, 15 gift tags and 15 envelopes
                  </p>
                )}

                {isGiftingTravel && !modalSubtitle && (
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
                          onChange={handleGoldFoilYes}
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
                      maxLength={2}
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
                      maxLength={40}
                      className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </div>
                )}

                {isStationeryProduct && effectivePersonalize === 'yes' && quantity > 1 && (
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                      Use these details for each set?
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="samePersonalizationForAll"
                          checked={samePersonalizationForAll}
                          onChange={() => setSamePersonalizationForAll(true)}
                          className="h-4 w-4 accent-foreground"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm font-light text-foreground/80">
                        <input
                          type="radio"
                          name="samePersonalizationForAll"
                          checked={!samePersonalizationForAll}
                          onChange={() => setSamePersonalizationForAll(false)}
                          className="h-4 w-4 accent-foreground"
                        />
                        No
                      </label>
                    </div>
                  </div>
                )}

                {isStationeryProduct &&
                  effectivePersonalize === 'yes' &&
                  quantity > 1 &&
                  !samePersonalizationForAll && (
                    <div className="mb-8 space-y-8">
                      {Array.from({ length: quantity - 1 }, (_, index) => {
                        const set = index + 2;
                        const detail = additionalPersonalizations[set] ?? {
                          greetingOption: 'No Greeting',
                          customGreeting: '',
                          name: '',
                        };

                        return (
                          <div key={`personalization-set-${set}`} className="space-y-6">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-light">
                              Set {set} details
                            </p>
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                                  Greeting
                                </p>
                                <select
                                  value={detail.greetingOption}
                                  onChange={(event) =>
                                    updateAdditionalPersonalization(set, 'greetingOption', event.target.value)
                                  }
                                  className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                >
                                  <option value="With Love">With Love</option>
                                  <option value="Best Wishes">Best Wishes</option>
                                  <option value="Love and Happiness">Love and Happiness</option>
                                  <option value="No Greeting">No Greeting</option>
                                  <option value="Custom Greeting">Custom Greeting</option>
                                </select>
                              </div>
                              {detail.greetingOption === 'Custom Greeting' && (
                                <input
                                  type="text"
                                  value={detail.customGreeting}
                                  onChange={(event) =>
                                    updateAdditionalPersonalization(set, 'customGreeting', event.target.value)
                                  }
                                  maxLength={35}
                                  placeholder="Enter greeting (max 35 characters)"
                                  className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                />
                              )}
                              <div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-light">
                                  Name
                                </p>
                                <input
                                  type="text"
                                  value={detail.name}
                                  onChange={(event) =>
                                    updateAdditionalPersonalization(set, 'name', event.target.value)
                                  }
                                  placeholder="Enter name"
                                  maxLength={40}
                                  className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
