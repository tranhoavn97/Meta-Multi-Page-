import express from "express";

// Handlers
import pagesHandler from "../api-src/pages";
import postsHandler from "../api-src/posts";
import deletePostHandler from "../api-src/delete-post";
import checkPagesHandler from "../api-src/check-pages";
import authUrlHandler from "../api-src/auth/url";
import authCallbackHandler from "../api-src/auth/callback";
import pageStatusHandler from "../api-src/page-status";
import businessesHandler from "../api-src/businesses";
import pageBusinessMapHandler from "../api-src/page-business-map";

// Job & Cron Handlers
import jobsCreateHandler from "../api-src/jobs/create";
import jobsStatusHandler from "../api-src/jobs/status";
import jobsActiveHandler from "../api-src/jobs/active";
import jobsResultsHandler from "../api-src/jobs/results";
import jobsPauseHandler from "../api-src/jobs/pause";
import jobsResumeHandler from "../api-src/jobs/resume";
import jobsCancelHandler from "../api-src/jobs/cancel";
import jobsRetryFailedHandler from "../api-src/jobs/retry-failed";
import pagesSyncHandler from "../api-src/pages/sync";
import pagesPostsHandler from "../api-src/pages/posts";
import pagesScanHandler from "../api-src/pages/scan";
import pagesAvatarHandler from "../api-src/pages/avatar";
import cronProcessJobsHandler from "../api-src/cron/process-jobs";
import cronRecoverStalledJobsHandler from "../api-src/cron/recover-stalled-jobs";
import apiManagerLatestResultsHandler from "../api-src/api-manager/latest-results";
import adminManagerLatestResultsHandler from "../api-src/admin-manager/latest-results";

const app = express();
app.use(express.json());

// Bind API Handlers directly to match Serverless routes
app.get("/api/auth/url", authUrlHandler);
app.get(["/auth/callback", "/auth/callback/"], authCallbackHandler);

app.get("/api/pages", pagesHandler);
app.get("/api/facebook/pages", pagesHandler);
app.post("/api/pages/sync", pagesSyncHandler);
app.get("/api/pages/avatar", pagesAvatarHandler);

app.get("/api/pages/:pageId/posts", (req: any, res: any, next: any) => {
  req.query.pageId = req.params.pageId;
  next();
}, pagesPostsHandler);

app.post("/api/pages/:pageId/scan", (req: any, res: any, next: any) => {
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

export default app;
