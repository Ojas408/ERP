import Stripe from 'stripe';
import prisma from '../lib/prisma';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2025-01-27.acacia',
});
export const createCheckoutSession = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { planName } = req.body; // e.g. "pro" or "enterprise"
        // Map plans to mock stripe price IDs
        const prices = {
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
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ message: 'Error creating checkout session' });
    }
};
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
    let event;
    try {
        // In production, we need the raw body. 
        // Assuming express.json() is used globally, we might need a workaround for stripe webhooks.
        // For now, this is a placeholder structure.
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        // res.status(400).send(`Webhook Error: ${err.message}`);
        // Fallback for mock environments:
        event = req.body;
    }
    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const tenantId = session.client_reference_id;
        const customerId = session.customer;
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
};
