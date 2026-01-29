# TikTok Content Generator 🎬

> A powerful SaaS platform for generating viral TikTok content for dropshippers and influencers. Supports Arabic and English content generation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

## 🌟 Features

### Content Generation
- **Script Generator** - 20-30 second video scripts with hooks, problems, solutions, and CTAs
- **Creative Angles** - 5 unique angles to present your product
- **Hook Ideas** - 10 attention-grabbing hooks for the first 3 seconds
- **Captions** - 5 engaging captions with emojis and CTAs
- **Hashtags** - 20 relevant hashtags (niche + trending + general)
- **Thumbnail Text** - 3 compelling thumbnail text suggestions

### Multi-Language Support
- Arabic (فصحى، مصري، سعودي، إماراتي، مغربي، شامي)
- English
- French, Spanish, German, Turkish, and more

### Multi-Platform Support
- TikTok
- Instagram Reels/Stories
- YouTube Shorts
- Facebook Reels
- Snapchat, Twitter/X, LinkedIn, Pinterest

### Chrome Extension
- Extract product data from AliExpress, Amazon, eBay, and more
- Quick generate content directly from product pages
- Floating action button on supported sites

### Subscription Plans
- **Free** - 10 generations/month
- **Pro** - 100 generations/month
- **Business** - Unlimited generations

## 🏗️ Architecture

```
tiktok-content-generator/
├── packages/
│   ├── backend/          # Node.js + Express + TypeScript API
│   ├── frontend/         # React + Vite + TailwindCSS
│   └── extension/        # Chrome Extension (Manifest V3)
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development (MySQL only)
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL (Railway)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth (JWT)
- **Payments**: Stripe
- **AI**: OpenAI API (GPT-4o, GPT-4o-mini)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Auth**: Supabase Client

### Chrome Extension
- **Manifest**: V3
- **Build**: Vite
- **Supported Sites**: AliExpress, Amazon, eBay, Etsy, Walmart, Temu, SHEIN

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL 8.0 (or Docker)
- Supabase account
- Stripe account
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tiktok-content-generator.git
cd tiktok-content-generator
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
# Copy example env files
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

4. **Start MySQL (using Docker)**
```bash
pnpm docker:dev
```

5. **Run database migrations**
```bash
pnpm db:push
pnpm db:seed
```

6. **Start development servers**
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/tiktok_generator

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# App
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📦 Deployment

### Using Docker

1. **Build images**
```bash
docker-compose build
```

2. **Start services**
```bash
docker-compose up -d
```

### Railway Deployment

1. Create a new project on Railway
2. Add MySQL service
3. Deploy backend from `packages/backend`
4. Deploy frontend from `packages/frontend`
5. Set environment variables
6. Connect custom domain

### Vercel Deployment (Frontend)

1. Import repository to Vercel
2. Set root directory to `packages/frontend`
3. Add environment variables
4. Deploy

## 🔌 API Endpoints

### Authentication
All endpoints (except health and plans) require `Authorization: Bearer <token>` header.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/me` | Get current user profile |
| GET | `/api/v1/plans` | List all plans |
| GET | `/api/v1/products` | List user's products |
| POST | `/api/v1/products` | Create new product |
| GET | `/api/v1/products/:id` | Get product details |
| POST | `/api/v1/generate/full-package` | Generate content |
| GET | `/api/v1/generate/usage` | Get usage stats |
| POST | `/api/v1/billing/create-checkout-session` | Create Stripe checkout |
| POST | `/api/v1/billing/webhook` | Stripe webhook |

## 🧩 Chrome Extension

### Installation (Development)

1. **Build the extension**
```bash
cd packages/extension
pnpm build
```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `packages/extension/dist`

### Supported Sites
- AliExpress
- Amazon (US, UK, DE, FR, AE, SA)
- eBay
- Etsy
- Walmart
- Temu
- SHEIN

## 📝 Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:backend      # Start backend only
pnpm dev:frontend     # Start frontend only

# Build
pnpm build            # Build all packages
pnpm build:backend    # Build backend
pnpm build:frontend   # Build frontend
pnpm build:extension  # Build extension

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed initial data
pnpm db:studio        # Open Drizzle Studio

# Docker
pnpm docker:dev       # Start dev MySQL
pnpm docker:build     # Build production images
pnpm docker:up        # Start production stack
pnpm docker:down      # Stop production stack

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for the powerful GPT models
- Supabase for authentication
- Stripe for payment processing
- Railway for hosting

---

**Built with ❤️ for the Arab dropshipping and influencer community**
