import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/atelier/PageLayout';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { postJSON } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';

type CreateOrderResponse = {
  orderId: string;
  displayId: string;
  hdfcOrderId: string;
  paymentLink: string;
  paymentLinkExpiry?: string;
  subtotal: number;
  totalItems: number;
};

const COUNTRY_CODE_OPTIONS = [
  ['Afghanistan', '+93'],
  ['Albania', '+355'],
  ['Algeria', '+213'],
  ['American Samoa', '+1-684'],
  ['Andorra', '+376'],
  ['Angola', '+244'],
  ['Anguilla', '+1-264'],
  ['Antigua and Barbuda', '+1-268'],
  ['Argentina', '+54'],
  ['Armenia', '+374'],
  ['Aruba', '+297'],
  ['Australia', '+61'],
  ['Austria', '+43'],
  ['Azerbaijan', '+994'],
  ['Bahamas', '+1-242'],
  ['Bahrain', '+973'],
  ['Bangladesh', '+880'],
  ['Barbados', '+1-246'],
  ['Belarus', '+375'],
  ['Belgium', '+32'],
  ['Belize', '+501'],
  ['Benin', '+229'],
  ['Bermuda', '+1-441'],
  ['Bhutan', '+975'],
  ['Bolivia', '+591'],
  ['Bosnia and Herzegovina', '+387'],
  ['Botswana', '+267'],
  ['Brazil', '+55'],
  ['British Virgin Islands', '+1-284'],
  ['Brunei', '+673'],
  ['Bulgaria', '+359'],
  ['Burkina Faso', '+226'],
  ['Burundi', '+257'],
  ['Cambodia', '+855'],
  ['Cameroon', '+237'],
  ['Canada', '+1'],
  ['Cape Verde', '+238'],
  ['Caribbean Netherlands', '+599'],
  ['Cayman Islands', '+1-345'],
  ['Central African Republic', '+236'],
  ['Chad', '+235'],
  ['Chile', '+56'],
  ['China', '+86'],
  ['Colombia', '+57'],
  ['Comoros', '+269'],
  ['Congo', '+242'],
  ['Cook Islands', '+682'],
  ['Costa Rica', '+506'],
  ['Croatia', '+385'],
  ['Cuba', '+53'],
  ['Curacao', '+599'],
  ['Cyprus', '+357'],
  ['Czech Republic', '+420'],
  ['Democratic Republic of the Congo', '+243'],
  ['Denmark', '+45'],
  ['Djibouti', '+253'],
  ['Dominica', '+1-767'],
  ['Dominican Republic', '+1-809'],
  ['Dominican Republic', '+1-829'],
  ['Dominican Republic', '+1-849'],
  ['Ecuador', '+593'],
  ['Egypt', '+20'],
  ['El Salvador', '+503'],
  ['Equatorial Guinea', '+240'],
  ['Eritrea', '+291'],
  ['Estonia', '+372'],
  ['Eswatini', '+268'],
  ['Ethiopia', '+251'],
  ['Falkland Islands', '+500'],
  ['Faroe Islands', '+298'],
  ['Fiji', '+679'],
  ['Finland', '+358'],
  ['France', '+33'],
  ['French Guiana', '+594'],
  ['French Polynesia', '+689'],
  ['Gabon', '+241'],
  ['Gambia', '+220'],
  ['Georgia', '+995'],
  ['Germany', '+49'],
  ['Ghana', '+233'],
  ['Gibraltar', '+350'],
  ['Greece', '+30'],
  ['Greenland', '+299'],
  ['Grenada', '+1-473'],
  ['Guadeloupe', '+590'],
  ['Guam', '+1-671'],
  ['Guatemala', '+502'],
  ['Guernsey', '+44-1481'],
  ['Guinea', '+224'],
  ['Guinea-Bissau', '+245'],
  ['Guyana', '+592'],
  ['Haiti', '+509'],
  ['Honduras', '+504'],
  ['Hong Kong', '+852'],
  ['Hungary', '+36'],
  ['Iceland', '+354'],
  ['India', '+91'],
  ['Indonesia', '+62'],
  ['Iran', '+98'],
  ['Iraq', '+964'],
  ['Ireland', '+353'],
  ['Isle of Man', '+44-1624'],
  ['Israel', '+972'],
  ['Italy', '+39'],
  ['Ivory Coast', '+225'],
  ['Jamaica', '+1-876'],
  ['Japan', '+81'],
  ['Jersey', '+44-1534'],
  ['Jordan', '+962'],
  ['Kazakhstan', '+7'],
  ['Kenya', '+254'],
  ['Kiribati', '+686'],
  ['Kosovo', '+383'],
  ['Kuwait', '+965'],
  ['Kyrgyzstan', '+996'],
  ['Laos', '+856'],
  ['Latvia', '+371'],
  ['Lebanon', '+961'],
  ['Lesotho', '+266'],
  ['Liberia', '+231'],
  ['Libya', '+218'],
  ['Liechtenstein', '+423'],
  ['Lithuania', '+370'],
  ['Luxembourg', '+352'],
  ['Macau', '+853'],
  ['Madagascar', '+261'],
  ['Malawi', '+265'],
  ['Malaysia', '+60'],
  ['Maldives', '+960'],
  ['Mali', '+223'],
  ['Malta', '+356'],
  ['Marshall Islands', '+692'],
  ['Martinique', '+596'],
  ['Mauritania', '+222'],
  ['Mauritius', '+230'],
  ['Mayotte', '+262'],
  ['Mexico', '+52'],
  ['Micronesia', '+691'],
  ['Moldova', '+373'],
  ['Monaco', '+377'],
  ['Mongolia', '+976'],
  ['Montenegro', '+382'],
  ['Montserrat', '+1-664'],
  ['Morocco', '+212'],
  ['Mozambique', '+258'],
  ['Myanmar', '+95'],
  ['Namibia', '+264'],
  ['Nauru', '+674'],
  ['Nepal', '+977'],
  ['Netherlands', '+31'],
  ['New Caledonia', '+687'],
  ['New Zealand', '+64'],
  ['Nicaragua', '+505'],
  ['Niger', '+227'],
  ['Nigeria', '+234'],
  ['Niue', '+683'],
  ['North Korea', '+850'],
  ['North Macedonia', '+389'],
  ['Northern Mariana Islands', '+1-670'],
  ['Norway', '+47'],
  ['Oman', '+968'],
  ['Pakistan', '+92'],
  ['Palau', '+680'],
  ['Palestine', '+970'],
  ['Panama', '+507'],
  ['Papua New Guinea', '+675'],
  ['Paraguay', '+595'],
  ['Peru', '+51'],
  ['Philippines', '+63'],
  ['Poland', '+48'],
  ['Portugal', '+351'],
  ['Puerto Rico', '+1-787'],
  ['Puerto Rico', '+1-939'],
  ['Qatar', '+974'],
  ['Reunion', '+262'],
  ['Romania', '+40'],
  ['Russia', '+7'],
  ['Rwanda', '+250'],
  ['Saint Barthelemy', '+590'],
  ['Saint Helena', '+290'],
  ['Saint Kitts and Nevis', '+1-869'],
  ['Saint Lucia', '+1-758'],
  ['Saint Martin', '+590'],
  ['Saint Pierre and Miquelon', '+508'],
  ['Saint Vincent and the Grenadines', '+1-784'],
  ['Samoa', '+685'],
  ['San Marino', '+378'],
  ['Sao Tome and Principe', '+239'],
  ['Saudi Arabia', '+966'],
  ['Senegal', '+221'],
  ['Serbia', '+381'],
  ['Seychelles', '+248'],
  ['Sierra Leone', '+232'],
  ['Singapore', '+65'],
  ['Sint Maarten', '+1-721'],
  ['Slovakia', '+421'],
  ['Slovenia', '+386'],
  ['Solomon Islands', '+677'],
  ['Somalia', '+252'],
  ['South Africa', '+27'],
  ['South Korea', '+82'],
  ['South Sudan', '+211'],
  ['Spain', '+34'],
  ['Sri Lanka', '+94'],
  ['Sudan', '+249'],
  ['Suriname', '+597'],
  ['Sweden', '+46'],
  ['Switzerland', '+41'],
  ['Syria', '+963'],
  ['Taiwan', '+886'],
  ['Tajikistan', '+992'],
  ['Tanzania', '+255'],
  ['Thailand', '+66'],
  ['Timor-Leste', '+670'],
  ['Togo', '+228'],
  ['Tokelau', '+690'],
  ['Tonga', '+676'],
  ['Trinidad and Tobago', '+1-868'],
  ['Tunisia', '+216'],
  ['Turkey', '+90'],
  ['Turkmenistan', '+993'],
  ['Turks and Caicos Islands', '+1-649'],
  ['Tuvalu', '+688'],
  ['Uganda', '+256'],
  ['Ukraine', '+380'],
  ['United Arab Emirates', '+971'],
  ['United Kingdom', '+44'],
  ['United States', '+1'],
  ['United States Virgin Islands', '+1-340'],
  ['Uruguay', '+598'],
  ['Uzbekistan', '+998'],
  ['Vanuatu', '+678'],
  ['Vatican City', '+39-06'],
  ['Venezuela', '+58'],
  ['Vietnam', '+84'],
  ['Wallis and Futuna', '+681'],
  ['Western Sahara', '+212'],
  ['Yemen', '+967'],
  ['Zambia', '+260'],
  ['Zimbabwe', '+263'],
].map(([label, code]) => ({ label, code }));

type CustomerAddress = {
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

export default function Cart() {
  const { toast } = useToast();
  const formatRs = (value: number) => `Rs. ${value.toLocaleString('en-IN')}`;
  const { items, updateQuantity, removeFromCart, totalItems, subtotal } = useCart();
  useImagePreloader(items.map((item) => item.img));
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState<CustomerAddress>({
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhoneCountryCode, setCustomerPhoneCountryCode] = useState('+91');
  const [customerPhone, setCustomerPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderNotice, setOrderNotice] = useState<{ status: 'idle' | 'loading' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });
  const shippingCost = customerAddress.city.trim().toLowerCase() === 'mumbai' || customerAddress.city.trim().toLowerCase() === '' ? 150 : 250;
  const orderTotal = subtotal + shippingCost;

  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    if (orderNotice.status === 'error') {
      setOrderNotice({ status: 'idle', message: '' });
    }
  };

  const handleCustomerAddressChange = (field: keyof CustomerAddress, value: string) => {
    setCustomerAddress((currentAddress) => ({
      ...currentAddress,
      [field]: value,
    }));
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

  const handleCustomerPhoneCountryCodeChange = (value: string) => {
    setCustomerPhoneCountryCode(value);
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

  const handleTermsAcceptedChange = (checked: boolean | 'indeterminate') => {
    setTermsAccepted(checked === true);
    if (orderNotice.status === 'error') {
      setOrderNotice({ status: 'idle', message: '' });
    }
  };

  const handleCartQuantityChange = (item: typeof items[number], nextQuantity: number) => {
    if (item.goldFoil === 'yes' && nextQuantity < 2) {
      toast({ description: 'Gold foil requires a minimum quantity of 2.' });
      return;
    }
    updateQuantity(
      item.id,
      item.personalize,
      item.greeting,
      item.personalizationName,
      item.personalizationDetails,
      item.initials,
      item.size,
      item.goldFoil,
      nextQuantity
    );
  };

  const handlePlaceOrder = async () => {
    const trimmedName = customerName.trim();
    const trimmedAddress = {
      streetAddress1: customerAddress.streetAddress1.trim(),
      streetAddress2: customerAddress.streetAddress2.trim(),
      city: customerAddress.city.trim(),
      state: customerAddress.state.trim(),
      country: customerAddress.country.trim(),
      zipCode: customerAddress.zipCode.trim(),
    };
    const trimmedEmail = customerEmail.trim();
    const trimmedPhone = customerPhone.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setOrderNotice({ status: 'error', message: 'Name is required.' });
      return;
    }
    if (!trimmedAddress.streetAddress1) {
      setOrderNotice({ status: 'error', message: 'Street address 1 is required.' });
      return;
    }
    if (!trimmedAddress.city) {
      setOrderNotice({ status: 'error', message: 'City is required.' });
      return;
    }
    if (!trimmedAddress.state) {
      setOrderNotice({ status: 'error', message: 'State is required.' });
      return;
    }
    if (!trimmedAddress.country) {
      setOrderNotice({ status: 'error', message: 'Country is required.' });
      return;
    }
    if (!trimmedAddress.zipCode) {
      setOrderNotice({ status: 'error', message: 'Zip code is required.' });
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
    if (!/^[0-9\-()\s]{5,24}$/.test(trimmedPhone)) {
      setOrderNotice({ status: 'error', message: 'Please enter a valid phone number.' });
      return;
    }
    if (!termsAccepted) {
      setOrderNotice({ status: 'error', message: 'Please agree to the Terms & Conditions to continue.' });
      return;
    }

    setOrderNotice({ status: 'loading', message: '' });

    try {
      const orderResult = await postJSON<CreateOrderResponse>('/api/orders', {
        items,
        customer: {
          fullName: trimmedName,
          address: trimmedAddress,
          email: trimmedEmail,
          phoneCountryCode: customerPhoneCountryCode,
          phoneNumber: trimmedPhone,
          phone: `${customerPhoneCountryCode} ${trimmedPhone}`,
        },
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
      });

      if (!orderResult.ok) {
        setOrderNotice({
          status: 'error',
          message: orderResult.message || 'Something went wrong while placing the order. Please try again.',
        });
        return;
      }

      if (!orderResult.data?.paymentLink || !orderResult.data?.hdfcOrderId) {
        setOrderNotice({
          status: 'error',
          message: 'Payment link was not created. Please try again.',
        });
        return;
      }

      localStorage.setItem('atelier2901-pending-payment-order', orderResult.data.hdfcOrderId);
      toast({ description: `Order ${orderResult.data.displayId || ''} created. Redirecting to payment.`.trim() });
      window.location.assign(orderResult.data.paymentLink);
    } catch {
      setOrderNotice({
        status: 'error',
        message: 'Something went wrong while placing the order. Please try again.',
      });
    }
  };

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
              key={`${item.id}-${item.personalize}-${item.greeting ?? 'none'}-${item.personalizationName ?? 'none'}-${JSON.stringify(item.personalizationDetails)}-${item.initials ?? 'none'}-${item.size ?? 'none'}-${item.goldFoil ?? 'none'}`}
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
                {item.personalizationDetails.length > 1 && (
                  <div className="mt-2 space-y-1">
                    {item.personalizationDetails.map((detail) => (
                      <p
                        key={`${item.id}-set-${detail.set}`}
                        className="text-xs uppercase tracking-widest text-muted-foreground font-light"
                      >
                        Set {detail.set}: Greeting {detail.greeting || 'None'}
                        {detail.name ? `, Name ${detail.name}` : ', Name none'}
                      </p>
                    ))}
                  </div>
                )}
                {item.initials !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Initials: {item.initials}
                  </p>
                )}
                {item.size !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Size: {item.size}
                  </p>
                )}
                {item.goldFoil !== null && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-light mt-2">
                    Gold foil: {item.goldFoil === 'yes' ? 'Yes' : 'No'}
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
                    handleCartQuantityChange(item, item.quantity - 1)
                  }
                  className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" strokeWidth={1.5} />
                </button>
                <span className="w-8 text-center font-light text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    handleCartQuantityChange(item, item.quantity + 1)
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
                    item.personalizationDetails,
                    item.initials,
                    item.size,
                    item.goldFoil
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
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                Products
              </span>
              <span className="font-sans text-base">
                {formatRs(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                Shipping (Please enter address below to view exact cost)
              </span>
              <span className="font-sans text-base">
                {formatRs(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                Subtotal
              </span>
              <span className="font-sans text-lg">
                {formatRs(orderTotal)}
              </span>
            </div>
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
              <label htmlFor="order-street-address-1" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                Street Address 1
              </label>
              <input
                id="order-street-address-1"
                type="text"
                value={customerAddress.streetAddress1}
                onChange={(event) => handleCustomerAddressChange('streetAddress1', event.target.value)}
                className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div>
              <label htmlFor="order-street-address-2" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                Street Address 2 <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>
              </label>
              <input
                id="order-street-address-2"
                type="text"
                value={customerAddress.streetAddress2}
                onChange={(event) => handleCustomerAddressChange('streetAddress2', event.target.value)}
                className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="order-city" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                  City
                </label>
                <input
                  id="order-city"
                  type="text"
                  value={customerAddress.city}
                  onChange={(event) => handleCustomerAddressChange('city', event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label htmlFor="order-state" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                  State
                </label>
                <input
                  id="order-state"
                  type="text"
                  value={customerAddress.state}
                  onChange={(event) => handleCustomerAddressChange('state', event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="order-country" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                  Country
                </label>
                <input
                  id="order-country"
                  type="text"
                  value={customerAddress.country}
                  onChange={(event) => handleCustomerAddressChange('country', event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div>
                <label htmlFor="order-zip-code" className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                  Zip Code
                </label>
                <input
                  id="order-zip-code"
                  type="text"
                  value={customerAddress.zipCode}
                  onChange={(event) => handleCustomerAddressChange('zipCode', event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
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
              <div className="grid grid-cols-[minmax(7rem,9rem)_1fr] gap-4">
                <select
                  value={customerPhoneCountryCode}
                  onChange={(event) => handleCustomerPhoneCountryCodeChange(event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                  aria-label="Phone country code"
                >
                  {COUNTRY_CODE_OPTIONS.map((option) => (
                    <option key={`${option.label}-${option.code}`} value={option.code}>
                      {option.code} {option.label}
                    </option>
                  ))}
                </select>
                <input
                  id="order-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => handleCustomerPhoneChange(event.target.value)}
                  className="w-full bg-transparent border-b border-border py-3 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms-and-conditions"
                checked={termsAccepted}
                onCheckedChange={handleTermsAcceptedChange}
                className="mt-0.5"
              />
              <label htmlFor="terms-and-conditions" className="text-sm font-light leading-relaxed text-muted-foreground">
                I agree to the{' '}
                <Link
                  to="/terms-and-conditions"
                  className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                >
                  terms and conditions
                </Link>
              </label>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={orderNotice.status === 'loading'}
            className="w-full py-4 bg-foreground text-background text-xs uppercase tracking-widest font-light hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {orderNotice.status === 'loading' ? 'Proceeding to payment...' : 'Checkout'}
          </button>
          
          <p className="text-center text-xs text-muted-foreground mt-4 font-light">
            You'll be redirected to HDFC SmartGateway to complete payment.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
