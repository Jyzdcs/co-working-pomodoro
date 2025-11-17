## Shared Pomodoro Room – Minimal Build

### Context & Goals

- Single shared timer so the crew focuses and breaks together.
- Zero auth, zero persistence beyond memory, zero automated tests.
- Built while vibe-coding: every step must be tiny and shippable in one sitting.

### Stack Snapshot

- Next.js 16 (App Router), React 19.
- Tailwind v4 for styling, Radix UI bits if needed.
- Socket.IO (server + client) for syncing.
- TanStack Query for client cache, Zod for payload sanity.

### Pages & Flow

1. `/` lobby
   - Input or auto-generate `roomId`.
   - Button pushes to `/r/[roomId]`.
2. `/r/[roomId]` room
   - Shows countdown, mode (Focus/Break), remaining time bar.
   - Buttons to start focus (25m) or break (5m).
   - Participants list optional (just count for now).

### Data & Realtime

- `timerHub` singleton (in-memory map `roomId -> { start, duration, mode }`).
- Socket endpoint `/api/socket`:
  - `join`: room join + instant `sync` emit with latest state.
  - `start`: validated payload updates hub + broadcasts `sync`.
- Clients compute `remaining` from timestamps; re-sync on reconnect.

### UI Implementation Steps

1. Install deps: `socket.io`, `socket.io-client`, `zod`.
2. Create `lib/timerHub.ts`.
3. Build `app/api/socket/route.ts` with shared server instance.
4. Hook `useRoomSocket` to connect, join room, listen for `sync`.
5. Hook `useCountdown` for ticking UI every ~250ms.
6. Lobby page with simple form + CTA.
7. Room page layout:
   - Header (room, participants count if available).
   - Timer card with big monospace numbers.
   - Two buttons: `Start Focus`, `Start Break`.
   - Optional notes: store nickname in `localStorage`.
8. Style using Tailwind; add micro animations only if time permits.

### Edge Handling

- New joiners instantly catch up via `sync`.
- If timer idle (no entry in hub), show “Waiting to start”.
- Server restart clears memory → acceptable for MVP; message “Timer reset” if state missing.

### Deployment & Ops

- Dev: `pnpm dev --filter web`.
- Build: `pnpm build --filter web`.
- Deploy: Vercel (supports websockets) or Fly.io for simple single-instance.
- Monitoring = console logs; no tests, no lint gating beyond existing setup.
