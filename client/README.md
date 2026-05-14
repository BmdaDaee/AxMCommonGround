# CommonGround Client

A React + TypeScript web UI for CommonGround – the relational state machine for couples.

## Design System: Obsidian Sovereign

- **Dark theme** with gold, purple, and red accents
- **Editorial aesthetic** – clean typography, high contrast, minimal ornament
- **Duality-focused** – colors and symbols reflect emotional complexity

## Tech Stack

- **Vite** – Fast build tooling
- **React 18** – UI framework
- **TypeScript** – Type safety
- **Tailwind CSS** – Utility-first styling
- **Radix UI** – Accessible components
- **tRPC** – Type-safe API communication
- **React Router** – Navigation
- **React Query** – Data fetching & caching

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:5173` by default.

**Note:** Ensure the CommonGround server is running on `http://localhost:3000` for tRPC communication.

### Build

```bash
npm run build
```

Outputs to `dist/`.

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # Main layout with sidebar
│   ├── pages/               # Route pages
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── BentlyPage.tsx
│   │   ├── XpPage.tsx
│   │   ├── MissionsPage.tsx
│   │   ├── JournalPage.tsx
│   │   ├── DeeplyUsPage.tsx
│   │   ├── CalendarPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   ├── theme.ts         # Design tokens
│   │   ├── trpc.ts          # tRPC client
│   │   └── utils.ts         # Helper functions
│   ├── styles/
│   │   └── globals.css      # Tailwind + base styles
│   ├── App.tsx              # Router setup
│   └── main.tsx             # Entry point
├── index.html               # HTML template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── vite.config.ts
```

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | User authentication |
| `/signup` | New account creation |
| `/dashboard` | Relational state overview |
| `/messages` | Direct messaging with partner |
| `/bently` | AI guidance & dual-current perspective |
| `/xp` | Progression & rank system |
| `/missions` | Relational missions & tasks |
| `/journal` | Private reflections |
| `/deeplyus` | Shared memory vault |
| `/calendar` | Shared events & milestones |
| `/settings` | User preferences & account |

## Authentication

Currently uses mock tokens stored in `localStorage`. Replace with actual tRPC auth flow:

```typescript
// pages/LoginPage.tsx
const result = await trpc.auth.login.mutate({ email, password });
localStorage.setItem('authToken', result.token);
```

## Styling

All styling uses **Tailwind CSS** with custom theme tokens from `src/lib/theme.ts`.

### Key Classes

- `.btn-primary` – Gold button (primary action)
- `.btn-secondary` – Outlined button (secondary action)
- `.btn-accent` – Purple button (accent action)
- `.btn-ghost` – Text button (tertiary)
- `.card` – Surface component
- `.badge` – Status badges

### Colors

- `bg-primary` – #D4AF37 (Midas Gold)
- `bg-accent` – #9D4EDD (Amethyst Purple)
- `bg-highlight` – #E63946 (Crisis Red)
- `text-primary` – #F5F5F5 (Off-white)
- Status colors: `aligned`, `stress`, `tension`, `stale`

## tRPC Integration

The client connects to the server's tRPC API at `http://localhost:3000/trpc`.

### Setup tRPC Mutations

Example:

```typescript
import { trpc } from '@/lib/trpc';

export const LoginPage: React.FC = () => {
  const loginMutation = trpc.auth.login.useMutation();

  const handleSubmit = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    // Handle result
  };

  // ...
};
```

## Environment Variables

Create `.env.local` in the `client/` directory:

```
VITE_TRPC_URL=http://localhost:3000
```

## Performance Notes

- **Lazy loading**: Route-based code splitting via React Router
- **Query caching**: React Query caches API responses (5-minute default)
- **Animations**: CSS transitions optimized for 60fps
- **Responsive**: Mobile-first design (tested on 375px+)

## Accessibility

- Semantic HTML structure
- Focus rings on interactive elements
- ARIA labels where appropriate
- Keyboard navigation support
- Color contrast meets WCAG AA standards

## Future Enhancements

- [ ] Infinite scroll for messages
- [ ] Real-time messaging via WebSockets
- [ ] Image upload for vault
- [ ] Dark/light theme toggle
- [ ] Offline support via Service Workers
- [ ] PWA capabilities
- [ ] Analytics integration

## Troubleshooting

### tRPC connection fails

Ensure the server is running on `http://localhost:3000` and the `/trpc` endpoint is available.

### Styles not loading

Check that Tailwind CSS is properly configured in `tailwind.config.ts` and `src/styles/globals.css` is imported in `main.tsx`.

### TypeScript errors

Run `npm run type-check` to see full type errors. Ensure types are imported correctly from tRPC server.

## Contributing

1. Follow the existing component structure
2. Use TypeScript strict mode
3. Keep components under 300 lines (split if needed)
4. Use semantic HTML
5. Test responsive design

## License

©️ AnarchyXMayhem LLC – CommonGround
