# ⛳ Golf Charity Subscription Platform
**Full-Stack MERN Application** — Play · Win · Give

> Built to spec from the Digital Heroes PRD. Monthly prize draws, Stableford score tracking, charity contributions, Stripe subscriptions, and a full admin panel.
  
---   
     
## 🗂 Project Structure
  
```  
golf-charity-platform/ 
├── backend/              # Node.js + Express + MongoDB API
│   ├── models/           # Mongoose schemas (User, Charity, Draw, Winner, Payment) 
│   ├── routes/           # REST API routes
│   ├── middleware/        # JWT auth, subscription guard, admin guard
│   ├── utils/            # Draw engine, email, seed script
│   └── server.js         # Entry point
│
└── frontend/             # React 18 SPA
    └── src/
        ├── pages/        # Public pages + User dashboard + Admin panel
        ├── components/   # Layout (PublicLayout, UserLayout, AdminLayout)
        ├── context/      # AuthContext (JWT + user state)
        ├── utils/        # Axios instance
        └── styles/       # Global CSS design system
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Stripe account (test mode)

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend — copy and fill in:**
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/golf_charity
JWT_SECRET=your_minimum_32_char_secret_here
JWT_EXPIRE=7d

STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxx
STRIPE_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxx

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@golfcharity.com

CLIENT_URL=http://localhost:3000
```

**Frontend — copy and fill in:**
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
```

---

### 3. Set Up Stripe Products

In your Stripe dashboard (test mode):
1. Create a **Product** called "Golf Charity Subscription"
2. Add two **Prices**:
   - Monthly: £9.99/month recurring → copy `price_xxx` to `STRIPE_MONTHLY_PRICE_ID`
   - Yearly: £99.99/year recurring → copy `price_xxx` to `STRIPE_YEARLY_PRICE_ID`
3. Set up a **Webhook** pointing to `https://yourdomain.com/api/payments/webhook`
   - Events to listen: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

### 4. Create Upload Directories

```bash
cd backend
mkdir -p uploads/charities uploads/proofs
```

---

### 5. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- ✅ Admin: `admin@golfcharity.com` / `Admin@1234`
- ✅ Test User: `user@golfcharity.com` / `User@1234` (active monthly sub)
- ✅ 5 sample charities (3 featured)
- ✅ 1 sample published draw

---

### 6. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm start
# → http://localhost:3000
```

---

## 🧪 Testing Checklist (per PRD)

| Feature | How to test |
|---------|-------------|
| User signup | `/register` — 2-step form with charity selection |
| Login | `/login` — use demo credentials |
| Subscription flow | Log in as test user → `/subscribe` → Stripe checkout (use card `4242 4242 4242 4242`) |
| Score entry (1–45) | Dashboard → Scores → Add score |
| Rolling 5-score window | Add 6th score — oldest auto-removed |
| Charity selection | Dashboard → Charity → change charity + contribution % |
| Draw simulation | Admin → Draws → Create → Manage → Run Simulation |
| Draw publish | Admin → Draws → [Draw] → Publish Draw |
| Winner verification | Admin → Winners → Review proof → Approve/Reject |
| Payout tracking | Admin → Winners → Mark Paid |
| Admin user edit | Admin → Users → [User] → Edit Scores |
| Subscription cancel | Dashboard → Settings → Cancel Subscription |
| Mobile responsive | Test all pages at 375px width |

---

## 🏗 Deployment

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Deploy /build folder to Vercel
# Set REACT_APP_API_URL=https://your-backend.railway.app/api
# Set REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Railway / Render (Backend)
```bash
# Set all env vars in Railway dashboard
# Start command: npm start
# Make sure MONGO_URI and STRIPE keys are set to live values
```

### MongoDB Atlas
- Create a cluster
- Whitelist `0.0.0.0/0` for Railway/Render
- Copy connection string to `MONGO_URI`

---

## 📋 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET  | `/api/auth/me` | JWT | Get current user |
| GET  | `/api/scores` | JWT | Get my scores |
| POST | `/api/scores` | JWT+Sub | Add a score |
| PUT  | `/api/scores/:id` | JWT+Sub | Edit a score |
| DELETE | `/api/scores/:id` | JWT+Sub | Delete a score |
| GET  | `/api/charities` | — | List charities |
| GET  | `/api/draws` | — | List published draws |
| POST | `/api/draws` | Admin | Create draw |
| POST | `/api/draws/:id/simulate` | Admin | Run simulation |
| POST | `/api/draws/:id/publish` | Admin | Publish draw |
| POST | `/api/payments/create-checkout` | JWT | Stripe checkout session |
| POST | `/api/payments/webhook` | Stripe | Stripe webhook handler |
| GET  | `/api/winners/my` | JWT | My winnings |
| POST | `/api/winners/:id/upload-proof` | JWT | Upload proof |
| GET  | `/api/winners` | Admin | All winners |
| PUT  | `/api/winners/:id/verify` | Admin | Approve/reject |
| PUT  | `/api/winners/:id/mark-paid` | Admin | Mark payout |
| GET  | `/api/admin/stats` | Admin | Dashboard analytics |
| GET  | `/api/admin/users` | Admin | All users |

---

## 🎨 Design System

- **Font Display:** Playfair Display (headings, numbers)
- **Font Body:** DM Sans (UI text)
- **Palette:** Deep navy `#060b14` · Forest green `#0d9e5c` · Gold `#d4a853`
- **Motion:** Framer Motion — page enters, draw reveals, card hovers
- **Philosophy:** Emotion-first, charity-led — deliberately avoids golf clichés

---

## 🔐 Security Features

- bcrypt password hashing (12 rounds)
- JWT authentication with 7-day expiry
- Stripe webhook signature verification
- Rate limiting (200 req/15min per IP)
- Helmet.js HTTP headers
- Input validation with express-validator
- Subscription check middleware on protected routes

---

*Built by Digital Heroes — digitalheroes.co.in*
