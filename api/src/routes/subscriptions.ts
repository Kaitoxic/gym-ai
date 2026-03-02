import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-02-25.clover',
});

const MONTHLY_PRICE_ID = process.env.STRIPE_PRICE_MONTHLY ?? '';
const YEARLY_PRICE_ID = process.env.STRIPE_PRICE_YEARLY ?? '';
const SUCCESS_URL = process.env.STRIPE_SUCCESS_URL ?? 'https://example.com/success';
const CANCEL_URL = process.env.STRIPE_CANCEL_URL ?? 'https://example.com/cancel';

// ─── GET /subscriptions/status ────────────────────────────────────────────────
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(req.user!.id);
    if (error || !user) return res.status(404).json({ error: 'user not found' });

    const status = (user.user_metadata?.subscription_status as string) ?? 'free';
    const periodEnd = user.user_metadata?.subscription_period_end ?? null;

    return res.json({ status, period_end: periodEnd });
  } catch (err: any) {
    return res.status(500).json({ error: 'status check failed', detail: err.message });
  }
});

// ─── POST /subscriptions/create-checkout ─────────────────────────────────────
router.post('/create-checkout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { plan } = req.body as { plan?: 'monthly' | 'yearly' };
    const priceId = plan === 'yearly' ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Stripe price not configured. Add STRIPE_PRICE_MONTHLY to .env' });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY to .env' });
    }

    // Get or create Stripe customer
    const { data: { user } } = await supabase.auth.admin.getUserById(req.user!.id);
    let customerId = user?.app_metadata?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        metadata: { supabase_user_id: req.user!.id },
      });
      customerId = customer.id;
      // Store customer ID in app_metadata (server-side only)
      await supabase.auth.admin.updateUserById(req.user!.id, {
        app_metadata: { stripe_customer_id: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { supabase_user_id: req.user!.id },
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    return res.status(500).json({ error: 'checkout creation failed', detail: err.message });
  }
});

// ─── POST /subscriptions/webhook ─────────────────────────────────────────────
// Note: this route uses raw body — registered BEFORE express.json() in index.ts
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;
        if (!userId) break;

        // Fetch subscription end date
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const periodEnd = new Date((subscription.current_period_end ?? subscription.billing_cycle_anchor) * 1000).toISOString();

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            subscription_status: 'pro',
            subscription_period_end: periodEnd,
            stripe_subscription_id: subscriptionId,
          },
        });
        console.log(`[stripe-webhook] user ${userId} upgraded to Pro (ends ${periodEnd})`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find(
          (u) => u.app_metadata?.stripe_customer_id === customerId
        );
        if (!user) break;

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const periodEnd = new Date((subscription.current_period_end ?? subscription.billing_cycle_anchor) * 1000).toISOString();

        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            subscription_status: isActive ? 'pro' : 'free',
            subscription_period_end: isActive ? periodEnd : null,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find(
          (u) => u.app_metadata?.stripe_customer_id === customerId
        );
        if (!user) break;

        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            subscription_status: 'free',
            subscription_period_end: null,
          },
        });
        console.log(`[stripe-webhook] user ${user.id} downgraded to Free`);
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error('[stripe-webhook] handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.json({ received: true });
});

export default router;
