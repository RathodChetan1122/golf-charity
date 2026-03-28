const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');
const { sendSubscriptionEmail } = require('../utils/email');

const PLANS = {
  monthly: { priceId: process.env.STRIPE_MONTHLY_PRICE_ID, name: 'Monthly', amount: 999 },
  yearly:  { priceId: process.env.STRIPE_YEARLY_PRICE_ID,  name: 'Yearly',  amount: 9999 },
};

// ─── POST /api/payments/create-checkout ───────────────────────────────────────
router.post('/create-checkout', protect, async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, error: 'Payment system not configured yet' });
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ success: false, error: 'Invalid plan' });

    const user = req.user;
    let customerId = user.subscription.stripeCustomerId;

    // Create or reuse Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { 'subscription.stripeCustomerId': customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?payment=success`,
      cancel_url:  `${process.env.CLIENT_URL}/subscribe?payment=cancelled`,
      metadata: { userId: user._id.toString(), plan },
      subscription_data: { metadata: { userId: user._id.toString(), plan } },
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/payments/cancel-subscription ───────────────────────────────────
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeSubId) {
      return res.status(400).json({ success: false, error: 'No active subscription found' });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubId, {
      cancel_at_period_end: true,
    });

    user.subscription.cancelAtPeriodEnd = true;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Subscription will cancel at end of billing period' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/payments/reactivate ────────────────────────────────────────────
router.post('/reactivate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription.stripeSubId) {
      return res.status(400).json({ success: false, error: 'No subscription to reactivate' });
    }

    await stripe.subscriptions.update(user.subscription.stripeSubId, {
      cancel_at_period_end: false,
    });

    user.subscription.cancelAtPeriodEnd = false;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/payments/history ────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(24);
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/payments/webhook — Stripe webhook ─────────────────────────────
router.post('/webhook', async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.json({ received: true, note: 'Stripe not configured' });
  }
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.metadata.userId;
        const plan    = session.metadata.plan;
        const sub     = await stripe.subscriptions.retrieve(session.subscription);

        await User.findByIdAndUpdate(userId, {
          'subscription.status':           'active',
          'subscription.plan':             plan,
          'subscription.stripeSubId':      sub.id,
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
          'subscription.cancelAtPeriodEnd': false,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId = sub.metadata.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          'subscription.status':           'active',
          'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
        });

        // Record payment
        await Payment.create({
          user:             userId,
          stripePaymentId:  invoice.payment_intent,
          stripeInvoiceId:  invoice.id,
          amount:           invoice.amount_paid,
          currency:         invoice.currency,
          plan:             sub.metadata.plan,
          status:           'succeeded',
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const sub     = await stripe.subscriptions.retrieve(invoice.subscription);
        const userId  = sub.metadata.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, { 'subscription.status': 'lapsed' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object;
        const userId = sub.metadata.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.status':    'cancelled',
            'subscription.stripeSubId': '',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub    = event.data.object;
        const userId = sub.metadata.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            'subscription.status':            sub.status === 'active' ? 'active' : sub.status,
            'subscription.currentPeriodEnd':  new Date(sub.current_period_end * 1000),
            'subscription.cancelAtPeriodEnd': sub.cancel_at_period_end,
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

module.exports = router;
