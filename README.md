<h1 align="center">✨ Fullstack Chat & Video Calling App ✨</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

Highlights:

- 🌐 Real-time Messaging with Typing Indicators & Reactions
- 📹 1-on-1 and Group Video Calls with Screen Sharing & Recording
- 🔐 JWT Authentication & Protected Routes
- 🌍 Language Exchange Platform with 32 Unique UI Themes
- ⚡ Tech Stack: React + Express + MongoDB + TailwindCSS + TanStack Query
- 🧠 Global State Management with Zustand
- 🚨 Error Handling (Frontend & Backend)
- 🚀 Free Deployment
- 🎯 Built with Scalable Technologies like Stream
- ⏳ And much more!

---

## 🧪 .env Setup

### Backend (`/backend`)

```
PORT=5001
MONGO_URI=your_mongo_uri
STEAM_API_KEY=your_steam_api_key
STEAM_API_SECRET=your_steam_api_secret
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=development
```

### Frontend (`/frontend`)

```
VITE_STREAM_API_KEY=your_stream_api_key
```

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 💻 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Vercel Deployment

- **Frontend**: A ready-to-use Vercel config is at [frontend/vercel.json](frontend/vercel.json). It builds the Vite app (`npm run build`) and serves the `dist` folder as a static SPA. When you add the site in Vercel set the build command to `npm run build` and the output directory to `dist`. Add your backend URL later as an environment variable (for example `VITE_BACKEND_URL`).

- **Backend**: A starter Vercel config is at [backend/vercel.json](backend/vercel.json). NOTE: Vercel deploys Node code as serverless functions — to deploy this Express app you should export the Express `app` (instead of calling `app.listen`) and add a simple serverless wrapper under `api/` or export a handler.

	- Required environment variables on Vercel (backend project): `MONGO_URI`, `JWT_SECRET_KEY`, and `FRONTEND_URL` (set this to your frontend URL, e.g. `https://my-frontend.vercel.app`) so CORS will allow requests from the deployed frontend.

	- Cookies & CORS notes when deploying frontend and backend as separate Vercel projects:

		- Frontend: set `VITE_BACKEND_URL` to your backend's full URL (for example `https://my-backend.vercel.app/api`).
		- Backend: set `FRONTEND_URL` to the frontend URL (for example `https://my-frontend.vercel.app`). The backend will set `Access-Control-Allow-Origin` to this exact origin and allow credentials.
		- Cookies: this app issues an HTTP-only cookie named `jwt`. Browsers only send cross-site cookies when the cookie has `SameSite=None; Secure`. In production the backend now sets `sameSite: 'none'` and `secure: true` so cookies will be sent when the frontend and backend are on different domains. In development it uses `lax` and `secure: false`.
		- If you prefer token-in-header auth instead of cookies (recommended for some deployments), remove `withCredentials` in the frontend and pass the token via an Authorization header.

	- Test endpoints:

		- Health check: `GET /api/health` (no auth) — use this to verify your backend URL from the frontend or Vercel health checks.

### Vercel Dashboard settings (recommended)

- Frontend project (frontend folder)
	- Framework Preset: `Vite`
	- Build Command: `npm run build`
	- Output Directory: `dist`
	- Environment Variables (in Vercel > Settings > Environment Variables):
		- `VITE_BACKEND_URL` = `https://<your-backend>.vercel.app/api`
		- `VITE_STREAM_API_KEY` = your stream key (optional)

- Backend project (backend folder)
	- Framework Preset: `Other` or `Node.js`
	- Build Command: leave empty if not required (Vercel will build `api/` functions)
	- Output Directory: leave default
	- Environment Variables (in Vercel > Settings > Environment Variables):
		- `MONGO_URI` = your Mongo connection string
		- `JWT_SECRET_KEY` = your jwt secret
		- `FRONTEND_URL` = `https://<your-frontend>.vercel.app`
		- `STREAM_API_KEY` and `STREAM_API_SECRET` if used

### Health-check / smoke-test commands

Use these after deploying to verify connectivity:

```bash
# Check backend health
curl -i https://<your-backend>.vercel.app/api/health

# From the frontend container (or browser) ensure the frontend can reach backend
curl -i $(jq -r '.VITE_BACKEND_URL' < frontend/.env.example)
```

Files added:
- [frontend/.env.example](frontend/.env.example)
- [backend/.env.example](backend/.env.example)


	Minimal steps to adapt `backend/src/server.js` for Vercel serverless:

	1. Stop calling `app.listen` in `backend/src/server.js` and export the `app`:

		 - Replace the `app.listen(...)` block with `export default app;` and keep `connectDB()` in a dev-only start script or in an initialization that runs only when executed directly.

	2. Add a serverless entry under `backend/api/server.js` (example):

		 ```javascript
		 import app from '../src/server.js';

		 export default function handler(req, res) {
			 return app(req, res);
		 }
		 ```

	3. Deploy the `backend` project in Vercel; set any required environment variables (like `MONGO_URI`, `JWT_SECRET_KEY`) in the Vercel dashboard.

If you'd like, I can create the `backend/api/server.js` wrapper and a small refactor patch to `server.js` so the backend is instantly deployable to Vercel — tell me if you want me to proceed.
