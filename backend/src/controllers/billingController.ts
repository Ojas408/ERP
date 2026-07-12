import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';
import prisma from '../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any,
});

const isProd = (process.env.NODE_ENV || 'development') === 'production';

export const createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const { planName } = req.body; // e.g. "pro" or "enterprise"

    // Map plans to mock stripe price IDs
    const prices: Record<string, string> = {
      pro: 'price_pro_mock',
      enterprise: 'price_ent_mock',
    };

    const priceId = prices[planName] || prices.pro;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `http://localhost:5173/settings?billing=success`,
      cancel_url: `http://localhost:5173/settings?billing=cancelled`,
      client_reference_id: tenantId,
      customer: tenant?.stripeCustomerId || undefined,
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

export const handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

  let event: any;

  try {
    // In production, we need the raw body.
    // Assuming express.json() is used globally, we might need a workaround for stripe webhooks.
    // For now, this is a placeholder structure.
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    // A failed signature check means the payload cannot be trusted. In production we must
    // reject it outright rather than silently accepting an unverified body, which would let
    // anyone forge webhook events. The unverified fallback is only for local/mock testing.
    if (isProd) {
      return res.status(400).json({ message: `Webhook signature verification failed: ${err.message}` });
    }
    console.warn('Stripe webhook signature verification failed; accepting unverified body (non-production only).');
    event = req.body;
  }

  try {
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tenantId = session.client_reference_id;
      const customerId = session.customer as string;

      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: customerId,
            subscriptionPlan: 'pro', // Ideally map from line items
          },
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
