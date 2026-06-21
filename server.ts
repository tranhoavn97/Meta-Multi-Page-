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
import pageStatusHandler from "./api/page-status";
import businessesHandler from "./api/businesses";
import pageBusinessMapHandler from "./api/page-business-map";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Bind API Handlers directly to match Serverless routes
app.get("/api/auth/url", authUrlHandler);
app.get(["/auth/callback", "/auth/callback/"], authCallbackHandler);

app.get("/api/pages", pagesHandler);
app.get("/api/facebook/pages", pagesHandler);

app.get("/api/posts", postsHandler);
app.get("/api/facebook/posts", postsHandler);

app.post("/api/delete-post", deletePostHandler);
app.post("/api/facebook/delete-post", deletePostHandler);

app.post("/api/check-pages", checkPagesHandler);

app.post("/api/page-status", pageStatusHandler);
app.get("/api/businesses", businessesHandler);
app.post("/api/page-business-map", pageBusinessMapHandler);

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
