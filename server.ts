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

// Job & Cron Handlers
import jobsCreateHandler from "./api/jobs/create";
import jobsStatusHandler from "./api/jobs/status";
import jobsActiveHandler from "./api/jobs/active";
import jobsResultsHandler from "./api/jobs/results";
import jobsPauseHandler from "./api/jobs/pause";
import jobsResumeHandler from "./api/jobs/resume";
import jobsCancelHandler from "./api/jobs/cancel";
import jobsRetryFailedHandler from "./api/jobs/retry-failed";
import pagesSyncHandler from "./api/pages/sync";
import pagesPostsHandler from "./api/pages/posts";
import pagesScanHandler from "./api/pages/scan";
import pagesAvatarHandler from "./api/pages/avatar";
import cronProcessJobsHandler from "./api/cron/process-jobs";
import cronRecoverStalledJobsHandler from "./api/cron/recover-stalled-jobs";
import apiManagerLatestResultsHandler from "./api/api-manager/latest-results";
import adminManagerLatestResultsHandler from "./api/admin-manager/latest-results";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Bind API Handlers directly to match Serverless routes
app.get("/api/auth/url", authUrlHandler);
app.get(["/auth/callback", "/auth/callback/"], authCallbackHandler);

app.get("/api/pages", pagesHandler);
app.get("/api/facebook/pages", pagesHandler);
app.post("/api/pages/sync", pagesSyncHandler);
app.get("/api/pages/avatar", pagesAvatarHandler);

app.get("/api/pages/:pageId/posts", (req, res, next) => {
  req.query.pageId = req.params.pageId;
  next();
}, pagesPostsHandler);

app.post("/api/pages/:pageId/scan", (req, res, next) => {
  req.query.pageId = req.params.pageId;
  next();
}, pagesScanHandler);

app.get("/api/posts", postsHandler);
app.get("/api/facebook/posts", postsHandler);

app.post("/api/delete-post", deletePostHandler);
app.post("/api/facebook/delete-post", deletePostHandler);

app.post("/api/check-pages", checkPagesHandler);

app.post("/api/page-status", pageStatusHandler);
app.get("/api/businesses", businessesHandler);
app.post("/api/page-business-map", pageBusinessMapHandler);

// Background Job status/control endpoints
app.post("/api/jobs/create", jobsCreateHandler);
app.get("/api/jobs/status", jobsStatusHandler);
app.get("/api/jobs/active", jobsActiveHandler);
app.get("/api/jobs/results", jobsResultsHandler);
app.post("/api/jobs/pause", jobsPauseHandler);
app.post("/api/jobs/resume", jobsResumeHandler);
app.post("/api/jobs/cancel", jobsCancelHandler);
app.post("/api/jobs/retry-failed", jobsRetryFailedHandler);

app.get("/api/api-manager/latest-results", apiManagerLatestResultsHandler);
app.get("/api/admin-manager/latest-results", adminManagerLatestResultsHandler);

// Cron trigger endpoints
app.post("/api/cron/process-jobs", cronProcessJobsHandler);
app.post("/api/cron/recover-stalled-jobs", cronRecoverStalledJobsHandler);

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
