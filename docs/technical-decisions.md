# Technical decisions

## BL-001 bootstrap decision

- Runtime: Node.js 22 LTS-compatible code with TypeScript.
- Backend HTTP: Fastify 5. The app is built in `src/bootstrap/app.ts`; the process entrypoint is `src/bootstrap/server.ts`.
- Backend validation: Zod for environment configuration and future request contracts.
- Backend test runner: Vitest. The first test uses Fastify injection and does not require a running port.
- Mobile: React Native with Expo and TypeScript. The first shell is `mobile/App.tsx`; navigation, state, form, ORM, storage, media, email and push providers remain open until their feature tickets need them.
- Architecture: preserve the selected Three-Layer structure; bootstrap code only wires the app and does not introduce business logic.

### Verification

- Backend: `npm run typecheck` and `npm test` pass in `backend/`.
- Mobile: run `npm install` then `npm run typecheck` in `mobile/` after the Expo dependency set is available.
- This decision does not claim that PostgreSQL migrations, auth, provider integrations, or device OTP/push are implemented.
