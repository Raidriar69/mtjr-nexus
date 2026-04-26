# MTJR Nexus — Full Deployment Guide

## Overview

| Service | Purpose |
|---------|---------|
| Vercel | Hosting (frontend + API routes) |
| MongoDB Atlas | Database |
| Stripe | Card / Apple Pay / Google Pay |
| PayPal | PayPal Checkout |
| NOWPayments | Crypto (BTC, ETH, SOL, LTC) |
| Namecheap / GoDaddy | Domain (mtjrnexus.com) |

---

## Step 1 — Push to GitHub

1. Open a terminal in `E:/Site`
2. Initialize Git and push:

```bash
git init
git add .
git commit -m "Initial commit — MTJR Nexus"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mtjr-nexus.git
git push -u origin main
```

> Create the repo first at https://github.com/new (set to **Private**)

---

## Step 2 — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Select your `mtjr-nexus` repository and click **Import**
4. Framework is auto-detected as **Next.js** — leave defaults
5. Expand **Environment Variables** and add every key from `.env.example`:

| Key | Value |
|-----|-------|
| `NEXTAUTH_URL` | `https://mtjrnexus.com` *(or your Vercel URL for now)* |
| `NEXTAUTH_SECRET` | 32+ random chars (run: `openssl rand -base64 32`) |
| `MONGODB_URI` | Your Atlas connection string |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | your Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `EMAIL_FROM` | `MTJR Nexus <you@gmail.com>` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | (set after step 4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `PAYPAL_ENV` | `live` |
| `PAYPAL_CLIENT_ID` | Your PayPal client ID |
| `PAYPAL_SECRET` | Your PayPal secret |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Same as `PAYPAL_CLIENT_ID` |
| `NOWPAYMENTS_API_KEY` | Your NOWPayments key |
| `NOWPAYMENTS_IPN_SECRET` | Your NOWPayments IPN secret |

6. Click **Deploy** — wait ~2 min for build to finish
7. Your site is live at `https://mtjr-nexus.vercel.app` (temporary URL)

---

## Step 3 — Domain Setup (mtjrnexus.com)

### Buy the Domain
- Namecheap: https://www.namecheap.com (search `mtjrnexus.com`, ~$10-12/yr)
- GoDaddy: https://www.godaddy.com
- Porkbun: https://porkbun.com (often cheapest, ~$9/yr)

### Point Domain to Vercel

**Option A — Use Vercel Nameservers (easiest)**

1. In Vercel → Your Project → **Settings → Domains**
2. Add `mtjrnexus.com` and `www.mtjrnexus.com`
3. Vercel shows you nameservers like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
4. In your domain registrar → DNS Management → change nameservers to the Vercel ones
5. Wait 10-30 min for propagation

**Option B — Add DNS Records Manually**

In your registrar DNS panel, add:
```
Type    Host    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Update NEXTAUTH_URL

Once domain is live, in Vercel → Settings → Environment Variables:
- Change `NEXTAUTH_URL` to `https://mtjrnexus.com`
- **Redeploy** (Vercel Dashboard → Deployments → click the latest → Redeploy)

> SSL is automatic — Vercel provisions a free Let's Encrypt cert within minutes.

---

## Step 4 — Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. URL: `https://mtjrnexus.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded` *(optional fallback)*
5. After creating, copy the **Signing secret** (`whsec_...`)
6. Add it to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
7. Redeploy

### Apple Pay / Google Pay Domain Verification (Stripe)

1. Go to https://dashboard.stripe.com/settings/payment_method_domains
2. Click **Add domain** → enter `mtjrnexus.com`
3. Stripe will auto-verify since it can reach your site via HTTPS

---

## Step 5 — PayPal Live Setup

1. Go to https://developer.paypal.com/developer/applications
2. Click **Create App** (select **Merchant** type)
3. Switch the toggle from **Sandbox** to **Live**
4. Copy **Client ID** and **Secret Key**
5. Add to Vercel env vars:
   - `PAYPAL_CLIENT_ID` = Client ID
   - `PAYPAL_SECRET` = Secret
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID` = Client ID (same value)
   - `PAYPAL_ENV` = `live`
6. In your PayPal app settings, add your return URL:
   - `https://mtjrnexus.com/checkout/success`
7. Redeploy

---

## Step 6 — NOWPayments Setup

1. Sign up at https://nowpayments.io
2. Go to **Store Settings → API Keys** → create a key → copy it
3. Go to **Store Settings → IPN** → set IPN Secret Key → copy it
4. IPN Callback URL to configure in NOWPayments dashboard:
   ```
   https://mtjrnexus.com/api/crypto/webhook
   ```
5. Add to Vercel:
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`
6. Enable coins: BTC, ETH, SOL, LTC in your NOWPayments store settings
7. Redeploy

---

## Step 7 — MongoDB Atlas Network Access

By default Atlas may only allow your home IP. For Vercel (serverless):

1. Go to Atlas → **Network Access**
2. Click **Add IP Address**
3. Choose **Allow access from anywhere** → enter `0.0.0.0/0`
4. Click **Confirm**

> This is standard for serverless deployments. Traffic is still authenticated by username/password in the URI.

---

## Step 8 — Post-Deploy Checklist

- [ ] Visit `https://mtjrnexus.com` — site loads correctly
- [ ] Sign up for an account — email arrives
- [ ] Add a test product via `/admin`
- [ ] Add to cart → checkout with a Stripe test card (`4242 4242 4242 4242`)
- [ ] Confirm order appears in `/orders` and credentials email arrives
- [ ] Switch Stripe to live mode (remove `sk_test_` keys, add `sk_live_`)
- [ ] Test PayPal sandbox → then switch to live credentials
- [ ] NOWPayments: test an invoice creation in sandbox → then go live
- [ ] Verify `www.mtjrnexus.com` redirects to `mtjrnexus.com`
- [ ] Run Google PageSpeed Insights on your URL

---

## Quick Reference — Useful URLs

| Resource | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Stripe Dashboard | https://dashboard.stripe.com |
| PayPal Developer | https://developer.paypal.com |
| NOWPayments Dashboard | https://account.nowpayments.io |
| MongoDB Atlas | https://cloud.mongodb.com |
| GitHub Repo | https://github.com/YOUR_USERNAME/mtjr-nexus |

---

## Redeploying After Changes

```bash
git add .
git commit -m "your change description"
git push
```

Vercel auto-deploys on every push to `main`. That's it.
