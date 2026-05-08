import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { cardRouter } from "./routes/cardRoutes.js";
import { deckRouter } from "./routes/deckRoutes.js";
import { projectRouter } from "./routes/projectRoutes.js";
import { publicRouter } from "./routes/publicRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// CORS: Allow same-origin requests + configured CLIENT_URL (for dev with separate frontend)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same origin (no origin header = same origin, like form submissions)
      // Also allow localhost variants for development
      if (!origin || origin.includes("localhost")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/cards", cardRouter);
app.use("/api/decks", deckRouter);
app.use("/api/public", publicRouter);

// Serve static files (React build)
app.use(express.static(path.join(__dirname, "../public")));

// SPA fallback: serve index.html for client-side routes (non-API)
app.get("*", (req, res, next) => {
  // If the request is for an API route, let the error handler catch it
  if (req.path.startsWith("/api")) {
    return next();
  }
  // Otherwise serve the SPA
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);
