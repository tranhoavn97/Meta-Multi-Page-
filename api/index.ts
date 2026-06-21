import express from "express";
import { safeHandler } from "./_lib/utils/wrapper.js";

// Handlers
import pagesHandler from "./_lib/pages-list.js";
import postsHandler from "./_lib/posts.js";
import deletePostHandler from "./_lib/delete-post.js";
import checkPagesHandler from "./_lib/check-pages.js";
import authUrlHandler from "./_lib/auth/url.js";
import authCallbackHandler from "./_lib/auth/callback.js";
import pageStatusHandler from "./_lib/page-status.js";
import businessesHandler from "./_lib/businesses.js";
import pageBusinessMapHandler from "./_lib/page-business-map.js";

// Job & Cron Handlers
import jobsCreateHandler from "./_lib/jobs/create.js";
import jobsStatusHandler from "./_lib/jobs/status.js";
import jobsActiveHandler from "./_lib/jobs/active.js";
import jobsResultsHandler from "./_lib/jobs/results.js";
import jobsPauseHandler from "./_lib/jobs/pause.js";
import jobsResumeHandler from "./_lib/jobs/resume.js";
import jobsCancelHandler from "./_lib/jobs/cancel.js";
import jobsRetryFailedHandler from "./_lib/jobs/retry-failed.js";
import pagesSyncHandler from "./_lib/pages/sync.js";
import pagesPostsHandler from "./_lib/pages/posts.js";
import pagesScanHandler from "./_lib/pages/scan.js";
import pagesAvatarHandler from "./_lib/pages/avatar.js";
import pagesMediaHandler from "./_lib/pages/media.js";
import cronProcessJobsHandler from "./_lib/cron/process-jobs.js";
import cronRecoverStalledJobsHandler from "./_lib/cron/recover-stalled-jobs.js";
import apiManagerLatestResultsHandler from "./_lib/api-manager/latest-results.js";
import adminManagerLatestResultsHandler from "./_lib/admin-manager/latest-results.js";

const app = express();
app.use(express.json());

// Bind API Handlers directly to match Serverless routes with safe try/catch environment wrappers
app.get("/api/auth/url", safeHandler("authUrl", ["META_APP_ID", "META_APP_SECRET"], authUrlHandler));
app.get(["/auth/callback", "/auth/callback/"], safeHandler("authCallback", ["META_APP_ID", "META_APP_SECRET"], authCallbackHandler));

app.get("/api/pages", safeHandler("pages", ["META_APP_SECRET"], pagesHandler));
app.get("/api/facebook/pages", safeHandler("pages", ["META_APP_SECRET"], pagesHandler));
app.post("/api/pages/sync", safeHandler("pagesSync", ["META_APP_SECRET"], pagesSyncHandler));
app.get("/api/pages/avatar", safeHandler("pagesAvatar", ["META_APP_SECRET"], pagesAvatarHandler));

app.get("/api/pages/:pageId/posts", (req: any, res: any, next: any) => {
  req.query.pageId = req.params.pageId;
  next();
}, safeHandler("pagesPosts", ["META_APP_SECRET"], pagesPostsHandler));

app.get("/api/pages/:pageId/media", (req: any, res: any, next: any) => {
  req.query.pageId = req.params.pageId;
  next();
}, safeHandler("pagesMedia", ["META_APP_SECRET"], pagesMediaHandler));

app.post("/api/pages/:pageId/scan", (req: any, res: any, next: any) => {
  req.query.pageId = req.params.pageId;
  next();
}, safeHandler("pagesScan", ["META_APP_SECRET"], pagesScanHandler));

app.get("/api/posts", safeHandler("posts", ["META_APP_SECRET"], postsHandler));
app.get("/api/facebook/posts", safeHandler("posts", ["META_APP_SECRET"], postsHandler));

app.post("/api/delete-post", safeHandler("deletePost", ["META_APP_SECRET"], deletePostHandler));
app.post("/api/facebook/delete-post", safeHandler("deletePost", ["META_APP_SECRET"], deletePostHandler));

app.post("/api/check-pages", safeHandler("checkPages", ["META_APP_SECRET"], checkPagesHandler));

app.post("/api/page-status", safeHandler("pageStatus", ["META_APP_SECRET"], pageStatusHandler));
app.get("/api/businesses", safeHandler("businesses", [], businessesHandler));
app.post("/api/page-business-map", safeHandler("pageBusinessMap", [], pageBusinessMapHandler));

// Background Job status/control endpoints
app.post("/api/jobs/create", safeHandler("jobsCreate", ["META_APP_SECRET"], jobsCreateHandler));
app.get("/api/jobs/status", safeHandler("jobsStatus", ["META_APP_SECRET"], jobsStatusHandler));
app.get("/api/jobs/active", safeHandler("jobsActive", ["META_APP_SECRET"], jobsActiveHandler));
app.get("/api/jobs/results", safeHandler("jobsResults", ["META_APP_SECRET"], jobsResultsHandler));
app.post("/api/jobs/pause", safeHandler("jobsPause", ["META_APP_SECRET"], jobsPauseHandler));
app.post("/api/jobs/resume", safeHandler("jobsResume", ["META_APP_SECRET"], jobsResumeHandler));
app.post("/api/jobs/cancel", safeHandler("jobsCancel", ["META_APP_SECRET"], jobsCancelHandler));
app.post("/api/jobs/retry-failed", safeHandler("jobsRetryFailed", ["META_APP_SECRET"], jobsRetryFailedHandler));

app.get("/api/api-manager/latest-results", safeHandler("apiManagerLatestResults", ["META_APP_SECRET"], apiManagerLatestResultsHandler));
app.get("/api/admin-manager/latest-results", safeHandler("adminManagerLatestResults", ["META_APP_SECRET"], adminManagerLatestResultsHandler));

// Cron trigger endpoints
app.post("/api/cron/process-jobs", safeHandler("cronProcessJobs", ["META_APP_SECRET"], cronProcessJobsHandler));
app.post("/api/cron/recover-stalled-jobs", safeHandler("cronRecoverStalledJobs", ["META_APP_SECRET"], cronRecoverStalledJobsHandler));

export default app;
