import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import pagesHandler from "./api/pages";
import postsHandler from "./api/posts";
import deletePostHandler from "./api/delete-post";
import checkPagesHandler from "./api/check-pages";
import authUrlHandler from "./api/auth/url";
import authCallbackHandler from "./api/auth/callback";
import authLogoutHandler from "./api/auth/logout";
import pageStatusHandler from "./api/page-status";
import businessesHandler from "./api/businesses";
import pageBusinessMapHandler from "./api/page-business-map";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Bind API Handlers directly to match Serverless routes
app.get("/api/auth/url", authUrlHandler as any);
app.get(["/auth/callback", "/auth/callback/"], authCallbackHandler as any);
app.get("/api/auth/logout", authLogoutHandler as any);

app.get("/api/pages", pagesHandler as any);
app.get("/api/facebook/pages", pagesHandler as any);

app.get("/api/posts", postsHandler as any);
app.get("/api/facebook/posts", postsHandler as any);

app.post("/api/delete-post", deletePostHandler as any);
app.post("/api/facebook/delete-post", deletePostHandler as any);

app.post("/api/check-pages", checkPagesHandler as any);

app.post("/api/page-status", pageStatusHandler as any);
app.get("/api/businesses", businessesHandler as any);
app.post("/api/page-business-map", pageBusinessMapHandler as any);

// Vite middleware configuration for development vs static build for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Lỗi khi khởi động server:", err);
});
