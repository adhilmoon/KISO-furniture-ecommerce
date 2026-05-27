# KISO — Furniture E‑Commerce

> **Foundation, essentials.** Handcrafted Indian furniture, sold direct from the studio.

KISO is a full‑stack furniture e‑commerce application: a customer storefront and a
separate admin console, built on Node.js + Express with server‑rendered EJS views,
MongoDB for persistence, and Tailwind CSS for the UI.

---

## Features

### Storefront (user)
- Scrollytelling hero, banner slider, curated rooms, featured products
- Product catalogue with variants (size/colour/material), stock, and dynamic pricing
- Product detail with image zoom, related products, and live stock state
- Cart with quantity steppers and availability gating before checkout
- Wishlist with in‑place add‑to‑cart / remove (no reload)
- Coupons and automatic product/category offers
- Checkout with multiple payment methods: **Razorpay**, **Wallet**, and **COD**
- Wallet with transaction history; referral rewards
- Order history, order detail, invoice PDF download
- Google OAuth login + email/password with OTP verification
- Address book with a reusable add/edit modal

### Admin console
- Dashboard, product / category / variant management (Cloudinary image upload + crop)
- Orders, coupons, offers, banners, and room management
- Sales reports with Excel export
- User management

---

## Tech Stack

| Layer        | Technology |
|--------------|-----------|
| Runtime      | Node.js 20 (ESM) |
| Web          | Express 5, express‑ejs‑layouts |
| Views        | EJS |
| Styling      | Tailwind CSS 3 (PostCSS + Autoprefixer) |
| Database     | MongoDB + Mongoose |
| Auth         | express‑session, Passport (Google OAuth 2.0), bcrypt, OTP email |
| Payments     | Razorpay, in‑app Wallet |
| Media        | Cloudinary, Multer, Cropper.js |
| Email        | Nodemailer |
| Documents    | PDFKit (invoices), ExcelJS (reports) |
| Security     | Helmet, express‑rate‑limit, mongo‑operator sanitize, sanitize‑html, Zod |
| Logging      | Winston, Morgan |

---

## Architecture

Requests flow through a layered structure — each layer has one job:

```
route  →  controller  →  service  →  repository  →  model (Mongoose)
            (HTTP)        (logic)      (DB access)
```

```
src/
├── app.js            # Express app bootstrap, middleware, route mounting
├── config/           # DB, Cloudinary, Razorpay, Passport
├── constants/        # messages, status codes, pagination
├── controller/       # request/response handlers (admin + user)
├── service/          # business logic
├── repository/       # data access (Mongoose queries)
├── model/            # Mongoose schemas
├── middleware/       # auth, sanitize, error handling, badges, categories
├── routes/           # admin.js, user.js, indexRoutes.js
├── utilities/        # logger, catchAsync, helpers
└── validators/       # Zod schemas

views/        # EJS templates (layouts, partials, user, admin, static)
public/       # static assets — js/, css/ (Tailwind in/out), images/
```

---

## Getting Started

### Prerequisites
- Node.js **20+**
- A MongoDB database (Atlas or local)
- Accounts/keys for Cloudinary, Razorpay, Google OAuth, and an SMTP sender

### Install
```bash
git clone https://github.com/adhilmoon/KISO-furniture-ecommerce.git
cd KISO-furniture-ecommerce
npm install          # postinstall builds Tailwind CSS automatically
```

### Configure
Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

### Run
```bash
npm run dev          # development (nodemon, auto-reload)
npm start            # production (plain node)
```

The server starts on `http://localhost:4004` (or `PORT`).

### Build CSS
Tailwind output (`public/css/output.css`) is **git‑ignored** and generated from
`public/css/input.css`:
```bash
npm run build:css    # one-off minified build
```
This runs automatically via `postinstall` / `npm run build`, so deploys that run
`npm install` get a compiled stylesheet without any extra step.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `4004`) |
| `NODE_ENV` | `production` enables secure cookies + `trust proxy` |
| `BASE_URL` | Public base URL of the app |
| `DB_URL` | MongoDB connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `COOKIE_MAX_AGE` | Session cookie lifetime in milliseconds |
| `BCRYPT_SALT_ROUNDS` | bcrypt hashing cost factor |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CALLBACK_URL` | Google OAuth redirect/callback URL |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `EMAIL_USER` | SMTP sender address (OTP / notifications) |
| `EMAIL_PASS` | SMTP sender password / app password |
| `CONTACT_EMAIL` | Public contact email shown on the site |
| `CONTACT_PHONE` | Public contact phone shown on the site |
| `SOCIAL_INSTAGRAM` | Instagram profile URL |
| `SOCIAL_FACEBOOK` | Facebook profile URL |
| `SOCIAL_PINTEREST` | Pinterest profile URL |

> Cloudinary credentials are loaded via `src/config` — set the standard
> `CLOUDINARY_URL` / Cloudinary env vars expected by the SDK.

---

## NPM Scripts

| Script | Action |
|--------|--------|
| `npm run dev` | Start with nodemon (auto‑reload) |
| `npm start` | Start with plain `node` (production) |
| `npm run build` | Build production assets (Tailwind CSS) |
| `npm run build:css` | Compile + minify Tailwind into `public/css/output.css` |
| `npm run lint` | Run ESLint (JS) and ejslint (EJS) |

---

## Deployment Notes
- `npm install` triggers `postinstall` → Tailwind build, so `output.css` exists on the server.
- Set `NODE_ENV=production` to enable secure cookies and proxy trust.
- Helmet's Cross‑Origin‑Opener‑Policy is set to `same-origin-allow-popups` so the
  Razorpay Checkout / netbanking popup flow is not blocked.
- Filenames are case‑sensitive on Linux hosts — keep EJS `include()` casing exact.

---

## License
ISC
