import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { ExpressAuth } from "@auth/express";
import Google from "@auth/core/providers/google";
import Github from "@auth/core/providers/github";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Check for missing auth variables
  if (!process.env.AUTH_SECRET || !process.env.GOOGLE_CLIENT_ID) {
    console.warn("⚠️ AUTH_SECRET or GOOGLE_CLIENT_ID is missing. Google Login will not work until these are set in the environment.");
  }

  // NextAuth (Auth.js) Configuration
  const authSecret = process.env.AUTH_SECRET;
  
  if (!authSecret) {
    console.error("❌ AUTH_SECRET is missing! Authentication will fail. Please set it in your environment variables.");
  }

  const authConfig = {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
      Github({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }),
    ],
    secret: authSecret || "fallback-secret-for-dev-only",
    trustHost: true,
  };

  // Auth routes
  app.use("/api/auth", ExpressAuth(authConfig));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
