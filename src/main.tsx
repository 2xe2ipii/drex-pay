import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// src/
// ├── components/        # Reusable UI parts
// │   ├── layout/        # Layout wrappers (Navbar, Container)
// │   ├── shared/        # Buttons, Cards, Badges
// │   └── dashboard/     # Specific widgets (Stats, PaymentHistory)
// ├── pages/             # The actual views
// │   ├── PublicDashboard.tsx  # Read-only view for them
// │   └── AdminDashboard.tsx   # The Manager's view (Drex only)
// ├── lib/               # Utilities & Database config
// │   ├── utils.ts       # Class name merger
// │   └── supabase.ts    # DB connection (we'll set this up later)
// ├── types/             # TypeScript definitions
// │   └── index.ts       # Interface definitions
// ├── App.tsx            # Routes setup
// └── main.tsx           # Entry point