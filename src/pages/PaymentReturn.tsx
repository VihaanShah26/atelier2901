import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Clock, XCircle } from 'lucide-react';
import PageLayout from '@/components/atelier/PageLayout';
import { useCart } from '@/contexts/CartContext';
import { postJSON } from '@/lib/api';

type PaymentVerificationResponse = {
  ok: boolean;
  orderId?: string;
  displayId?: string;
  status?: 'paid' | 'payment_pending' | 'payment_failed' | 'payment_review_required' | string;
  hdfcStatus?: string;
  message?: string;
};

const PENDING_PAYMENT_STORAGE_KEY = 'atelier2901-pending-payment-order';
const PENDING_POLL_DELAYS_MS = [15000, 15000, 15000, 15000, 15000, 15000, 30000, 180000];

export default function PaymentReturn() {
  const location = useLocation();
  const { clearCart } = useCart();
  const [result, setResult] = useState<PaymentVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');

  const returnParams = useMemo(() => {
    const params: Record<string, string> = {};
    new URLSearchParams(location.search).forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [location.search]);

  const fallbackOrderId =
    typeof window !== 'undefined'
      ? localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY) || ''
      : '';
  const orderId = returnParams.order_id || returnParams.orderId || fallbackOrderId;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const verifyPayment = async (attemptNumber: number) => {
      if (!orderId) {
        setLoading(false);
        setError('We could not identify this payment. Please contact us with your payment details.');
        return;
      }

      setLoading(true);
      const response = await postJSON<PaymentVerificationResponse>('/api/payments/verify', {
        orderId,
        returnParams,
      });

      if (cancelled) return;

      if (!response.ok || !response.data) {
        setLoading(false);
        setError(response.message || response.data?.message || 'We could not verify the payment.');
        return;
      }

      setResult(response.data);
      setLoading(false);

      if (response.data.status === 'paid') {
        clearCart();
        localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
        return;
      }

      if (response.data.status === 'payment_pending' && attemptNumber < PENDING_POLL_DELAYS_MS.length) {
        timer = setTimeout(() => {
          setAttempt((current) => current + 1);
        }, PENDING_POLL_DELAYS_MS[attemptNumber]);
      }
    };

    verifyPayment(attempt);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [attempt, clearCart, orderId, returnParams]);

  const status = result?.status;
  const isPaid = status === 'paid';
  const isPending = status === 'payment_pending';
  const isReview = status === 'payment_review_required';
  const isFailed = Boolean(error) || (!loading && result && !isPaid && !isPending && !isReview);

  return (
    <PageLayout>
      <section className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24 text-center">
        <div className="animate-fade-in opacity-0">
          <div className="w-16 h-16 mx-auto mb-8 border border-accent flex items-center justify-center">
            {loading || isPending ? (
              <Clock className="w-8 h-8 text-accent" strokeWidth={1.5} />
            ) : isPaid ? (
              <Check className="w-8 h-8 text-accent" strokeWidth={1.5} />
            ) : (
              <XCircle className="w-8 h-8 text-accent" strokeWidth={1.5} />
            )}
          </div>

          <h1 className="font-sans text-3xl md:text-4xl mb-4">
            {loading
              ? 'Verifying payment'
              : isPaid
                ? 'Payment received'
                : isPending
                  ? 'Payment pending'
                  : isReview
                    ? 'Payment under review'
                    : 'Payment not completed'}
          </h1>

          <p className="text-muted-foreground font-light mb-8">
            {loading
              ? 'Please wait while we confirm your payment.'
              : isPaid
                ? `Your order ${result?.displayId || ''} has been confirmed. We'll email the invoice shortly.`.trim()
                : isPending
                  ? 'We are still waiting for final confirmation from the bank. This page will keep checking.'
                  : isReview
                    ? 'We received a payment response that needs manual review. Please contact us before placing the order again.'
                    : error || result?.message || 'You can return to your cart and try payment again.'}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!isPaid && (
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Return to cart
              </Link>
            )}
            {isPaid && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-widest font-light text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Continue browsing
              </Link>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
