# MindDeck

A spaced-repetition study app. Every flashcard is a multiple-choice question, and a scheduler decides when you should see each card again based on how well you remembered it.

**Live demo:** <https://frontend-five-topaz-84.vercel.app/>

Demo login: `demo@minddeck.local` / `Demo@1234`

The backend runs on a free Render plan, so the first request after a quiet period can take up to a minute while it wakes up.

## Features

- Register and log in; every user's decks, cards and stats are private
- Create and delete decks; add, view and delete multiple-choice cards
- Daily study queue: cards that are due plus a limited number of new cards
- Pick an answer, check it, then rate yourself Again / Hard / Good / Easy
- Dashboard with a streak, reviews today and a 30-day activity chart

## Tech stack

- Frontend: React 19 and Vite
- Backend: Express 5
- Database: PostgreSQL with Prisma
- Validation: Zod
- Authentication: JWT and bcrypt
- Tests: Vitest and Supertest

## Setup

Requirements: Node.js 20 or newer and a PostgreSQL database.

Backend:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Open `backend/.env` and set `DATABASE_URL` and `JWT_SECRET`. Then run:

```powershell
npx prisma migrate deploy
npm run seed
npm run dev
```

Frontend (in a second terminal):

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>.

Tests (inside the `backend` folder):

```powershell
npm test
```

## Demo login

- Email: `demo@minddeck.local`
- Password: `Demo@1234`

The seed script creates this account with a sample deck.

## Deployment

- Frontend: Vercel, built from the `frontend` folder, with `VITE_API_URL` pointing at the API
- Backend: Render web service, built from the `backend` folder
- Database: Neon PostgreSQL, set up with `npx prisma migrate deploy` and `npm run seed`
- Secrets such as `DATABASE_URL` and `JWT_SECRET` are set as environment variables on the hosting services and are never committed

## Data model

| Model | Purpose |
| --- | --- |
| User | An account with a hashed password |
| UserSettings | Timezone and daily new-card limit, one per user |
| Deck | A named collection of cards owned by one user |
| Card | A multiple-choice question plus its scheduling state (interval, ease factor, repetitions, next review date) |
| Review | A history record of every rating, with the interval before and after |

Deleting a deck also deletes its cards and their reviews.

## Design decisions

- **Scheduler:** an SM-2 style algorithm in `backend/src/services/reviewScheduler.js`. It is a pure function, so it is easy to unit test.
- **Timezone-aware daily queue:** what counts as "today" depends on the user's timezone, not the server's.
- **Server-side security:** the user id always comes from the verified JWT, never from the request body. Every query filters by owner, so one user can never read or change another user's data.
- **Validation:** every endpoint validates its input with Zod and returns a clear error message that the UI shows.
- **Consistency:** saving a review updates the card and writes the history row in one database transaction.

## What is finished

- Registration, login and a persistent session
- Deck and card creation, viewing and deletion
- The spaced-repetition scheduler, the daily study queue and the stats dashboard
- 30 automated tests covering the scheduler, authentication and input validation
- A seed script with a demo account

## What is not finished, and what I would do with more time

- Editing decks and cards in the UI (the API already supports it)
- Password reset and email verification
- Rate limiting on login
- Integration tests that run against a real test database
- Proper page routing instead of anchor links in the sidebar
