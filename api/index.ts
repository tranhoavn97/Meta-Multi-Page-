import express from "express";
import { safeHandler } from "../api-src/utils/wrapper";

// Handlers
import pagesHandler from "../api-src/pages-list";
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
