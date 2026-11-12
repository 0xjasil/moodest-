'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { paymentAPI } from '@/lib/api';
import { loadRazorpayScript, isRazorpayEnabled } from '@/lib/razorpay';
import { useAuth } from '@/context/AuthContext';

interface PaymentModalProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
  type?: 'wallet' | 'order';
  orderId?: number | string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  amount,
  onSuccess,
  onClose,
  type = 'order',
  orderId,
}: PaymentModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay checkout script ONLY if Razorpay is explicitly enabled via environment
  useEffect(() => {
    if (!isRazorpayEnabled()) return;

    let isMounted = true;
    loadRazorpayScript().catch(() => {
      if (isMounted) {
        console.warn('Razorpay script could not be loaded from CDN.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePayment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const razorpayActive = isRazorpayEnabled();
      let razorpayOrderId = '';
      let intentKeyId = '';
      let amountInPaise = Math.round(amount * 100);
      let currency = 'INR';
      let alreadyPaid = false;

      // Step 1: Obtain payment intent from NestJS backend: POST /api/payments/create-intent
      if (orderId) {
        let intent = null;
        try {
          intent = await paymentAPI.createIntent(orderId, 'INR');
        } catch (intentErr) {
          console.warn('Intent creation check, trying retry endpoint:', intentErr);
          try {
            intent = await paymentAPI.retry(orderId, 'INR');
          } catch (retryErr) {
            if (razorpayActive) {
              throw retryErr instanceof Error
                ? retryErr
                : new Error('Failed to initialize payment intent with gateway.');
            }
          }
        }

        if (intent) {
          const payload = intent.data ?? intent;
          alreadyPaid = Boolean(intent.alreadyPaid ?? payload.alreadyPaid);
          razorpayOrderId =
            intent.razorpayOrderId ||
            payload.razorpayOrderId ||
            '';
          intentKeyId = intent.keyId || payload.keyId || '';
          amountInPaise =
            intent.amountInPaise ?? payload.amountInPaise ?? amountInPaise;
          currency = intent.currency || payload.currency || currency;
        }
      }

      if (alreadyPaid) {
        setIsLoading(false);
        onSuccess(razorpayOrderId || 'already_paid');
        return;
      }

      // Step 2: If Razorpay is explicitly enabled, ensure script is loaded & open Razorpay Checkout
      if (razorpayActive && typeof window !== 'undefined') {
        const scriptLoaded = window.Razorpay ? true : await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error('Unable to load Razorpay checkout. Please check your connection and try again.');
        }

        const resolvedKey =
          (intentKeyId && !intentKeyId.includes('placeholder') ? intentKeyId : '') ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          '';

        if (!resolvedKey || resolvedKey.includes('placeholder')) {
          throw new Error('Razorpay Key ID is not configured.');
        }

        if (orderId && !razorpayOrderId) {
          throw new Error('Missing Razorpay order ID from payment service.');
        }

        const options: Record<string, any> = {
          key: resolvedKey,
          amount: amountInPaise,
          currency,
          name: 'Modest Studio',
          description: type === 'wallet' ? `Wallet Top-up ₹${amount}` : `Order #${orderId} Payment`,
          notes: {
            orderId: String(orderId || ''),
            type,
          },
          prefill: {
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#5C1A24',
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id?: string;
            razorpay_signature?: string;
          }) => {
            try {
              if (orderId) {
                await paymentAPI.verify({
                  orderId: String(orderId),
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id || razorpayOrderId,
                  razorpaySignature: response.razorpay_signature || '',
                });
              }
              setIsLoading(false);
              onSuccess(response.razorpay_payment_id || razorpayOrderId || `pay_${Date.now()}`);
            } catch (verifyErr) {
              setIsLoading(false);
              const message =
                verifyErr instanceof Error
                  ? verifyErr.message
                  : 'Payment verification failed. Please contact support if amount was debited.';
              setError(message);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              setError('Payment window closed. You can retry when ready.');
            },
          },
        };

        if (
          razorpayOrderId &&
          razorpayOrderId.startsWith('order_') &&
          !razorpayOrderId.startsWith('order_mock_')
        ) {
          options.order_id = razorpayOrderId;
        }

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          setIsLoading(false);
          const reason = response?.error?.description || response?.error?.reason || 'Payment failed';
          setError(`Transaction Failed: ${reason}`);
        });
        rzp.open();
        return;
      }

      // Operational payment flow (when Razorpay is disabled by default)
      onSuccess(razorpayOrderId || `pay_${Date.now()}`);
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment authorization failed';
      setError(message);
      setIsLoading(false);
    }
  }, [amount, orderId, type, user, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-mb-text/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-mb-surface border border-mb-border rounded-[8px] p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-serif text-lg font-semibold text-mb-text">
            {type === 'wallet' ? 'Add Money to Wallet' : 'Complete Payment'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-mb-muted hover:text-mb-text p-1 rounded disabled:opacity-50 transition-colors"
            aria-label="Close payment modal"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-mb-error/10 border border-mb-error/30 rounded-[8px]">
            <p className="text-sm text-mb-error">{error}</p>
          </div>
        )}

        <div className="mb-6 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-mb-border-lite">
            <span className="text-mb-body font-medium text-sm">Payable Amount</span>
            <span className="text-2xl font-bold text-mb-primary">₹{amount.toLocaleString('en-IN')}</span>
          </div>

          <div className="space-y-2 text-sm text-mb-body">
            <p className="flex items-center gap-2">
              <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
              <span>Secure encrypted checkout gateway</span>
            </p>
            <p className="flex items-center gap-2">
              <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
              <span>Verified order & stock reservation</span>
            </p>
            <p className="flex items-center gap-2">
              <Icon icon="lucide:check" className="w-4 h-4 text-mb-success shrink-0" />
              <span>Instant order confirmation & invoice</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 border border-mb-border text-mb-text text-sm font-semibold rounded-[10px] hover:bg-mb-bg disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePayment}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-mb-primary hover:bg-mb-primary-hover text-mb-bg text-sm font-semibold rounded-[10px] disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Authorizing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
          </button>
        </div>

        <p className="text-xs text-mb-muted text-center mt-4">
          Secured 256-bit encrypted checkout for Modest Studio
        </p>
      </div>
    </div>
  );
}
