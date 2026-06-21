import { 
  readDb, writeDb, encrypt, decrypt, acquireLock, releaseLock, releaseAllExpiredLocks, 
  BackgroundJob, CachedPage, CachedPost 
} from "./db.js";
import { 
  fetchFacebookPages, fetchFacebookPageAvatar, fetchFacebookPosts, fetchFacebookVideos, deleteFacebookItem 
} from "./meta.js";
import { fetchWithTimeout } from "./utils/wrapper.js";

const MAX_CONCURRENT_JOBS = 4;
const MAX_INVOCATION_TIME_MS = 8000;
const GRAPH_API_VERSION = "v23.0";

// Helper function to fetch JSON securely
async function fbFetchJson(url: string, options: any = {}): Promise<any> {
  const res = await fetchWithTimeout(url, options);
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Facebook API returned invalid JSON: ${text.slice(0, 500)}`);
  }
  if (!res.ok) {
    throw new Error(data.error?.message || `API Error ${res.status}: ${text.slice(0, 300)}`);
  }
  return data;
}

export async function processJobs(): Promise<{ processedCount: number; activeJobsCount: number }> {
  releaseAllExpiredLocks();

  const db = readDb();
  const now = new Date();

  const runningJobs = db.background_jobs.filter(j => j.status === "running");
  const pendingJobs = db.background_jobs.filter(j => j.status === "pending" || j.status === "queued");

  let processedCount = 0;

  if (runningJobs.length < MAX_CONCURRENT_JOBS && pendingJobs.length > 0) {
    pendingJobs.sort((a, b) => b.priority - a.priority);

    for (const job of pendingJobs) {
      if (db.background_jobs.filter(j => j.status === "running").length >= MAX_CONCURRENT_JOBS) {
        break;
      }

      if (job.type === "delete_posts") {
        const canLock = acquireLock(job.page_id, job.id, "delete", 120);
        if (!canLock) {
          console.log(`Job ${job.id} for Page ${job.page_id} skipped: Lock active.`);
          continue; 
        }
      }

      const dbJob = db.background_jobs.find(j => j.id === job.id);
      if (dbJob) {
        dbJob.status = "running";
        dbJob.started_at = now.toISOString();
        dbJob.updated_at = now.toISOString();
        dbJob.attempt_count += 1;
        writeDb(db);
        
        await executeJobAsync(job.id);
        processedCount++;
      }
    }
  }

  const updatedDb = readDb();
  return {
    processedCount,
    activeJobsCount: updatedDb.background_jobs.filter(j => j.status === "running").length
  };
}

async function executeJobAsync(jobId: string): Promise<void> {
  const startTime = Date.now();
  console.log(`Starting background job ${jobId}...`);

  try {
    const db = readDb();
    const job = db.background_jobs.find(j => j.id === jobId);
    if (!job || job.status !== "running") return;

    if (job.type === "sync_pages") {
      await handleSyncPages(job);
    } else if (job.type === "scan_posts") {
      await handleScanPosts(job, startTime);
    } else if (job.type === "delete_posts") {
      await handleDeletePosts(job, startTime);
    } else if (job.type === "check_page_access") {
      await handleCheckPageAccess(job);
    } else if (job.type === "refresh_avatar") {
      await handleRefreshAvatar(job);
    } else if (job.type === "refresh_page_stats") {
      await handleRefreshPageStats(job);
    } else if (job.type === "check_api_access") {
      await handleCheckApiAccess(job, startTime);
    } else if (job.type === "scan_page_admins") {
      await handleScanPageAdmins(job, startTime);
    }
  } catch (error: any) {
    console.error(`Error in job ${jobId}:`, error);
    const db = readDb();
    const job = db.background_jobs.find(j => j.id === jobId);
    if (job) {
      job.status = job.attempt_count >= job.max_attempts ? "failed" : "pending";
      job.last_error = error.message || String(error);
      job.updated_at = new Date().toISOString();
      if (job.type === "delete_posts") {
        releaseLock(job.page_id, job.id);
      }
      writeDb(db);
    }
  }
}

// 1. Sync Pages Job
async function handleSyncPages(job: BackgroundJob): Promise<void> {
  const { userToken } = job.payload;
  if (!userToken) throw new Error("Missing user token in payload");

  const fbPages = await fetchFacebookPages(userToken);
  const db = readDb();

  const pagesWithPictures = await Promise.all(
    fbPages.map(async (page: any) => {
      const avatar = await fetchFacebookPageAvatar(page.id, page.access_token || userToken);
      page.avatar_url = avatar;
      return page;
    })
  );

  const syncedPages: CachedPage[] = pagesWithPictures.map((page: any) => {
    const tasks = page.tasks || [];
    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreate = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");
    
    let accessStatus: CachedPage["access_status"] = "Bình thường";
    if (!page.access_token) {
      accessStatus = "Token lỗi";
    } else if (!hasManage || !hasCreate) {
      accessStatus = "Thiếu quyền";
    }

    let monetizationStatus = "Chưa xác định";
    if (page.monetization_status !== undefined || page.is_monetized !== undefined || page.monetization_enabled !== undefined) {
      const specVal = page.monetization_status || page.is_monetized || page.monetization_enabled;
      monetizationStatus = `Đặc biệt: ${specVal}`;
    } else if (accessStatus === "Token lỗi" || accessStatus === "Thiếu quyền") {
      monetizationStatus = "Không đủ quyền kiểm tra";
    }

    return {
      id: page.id,
      name: page.name,
      avatar_url: page.avatar_url || "",
      access_status: accessStatus,
      tasks: page.tasks || [],
      last_synced_at: new Date().toISOString(),
      access_token_encrypted: encrypt(page.access_token || ""),
      category: page.category || "",
      monetization_status: monetizationStatus
    };
  });

  db.cached_pages = syncedPages;

  const finalJob = db.background_jobs.find(j => j.id === job.id);
  if (finalJob) {
    finalJob.status = "completed";
    finalJob.progress = 100;
    finalJob.processed_items = 1;
    finalJob.total_items = 1;
    finalJob.success_items = 1;
    finalJob.completed_at = new Date().toISOString();
    finalJob.updated_at = new Date().toISOString();
  }

  writeDb(db);
}

// 2. Scan Posts & Videos Job
async function handleScanPosts(job: BackgroundJob, startTime: number): Promise<void> {
  const { pageId, limit } = job.payload;
  const db = readDb();
  
  const pageCache = db.cached_pages.find(p => p.id === pageId);
  if (!pageCache) throw new Error(`Page ${pageId} not found in DB cache.`);

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  if (!pageToken) throw new Error(`Access token missing for Page ${pageId}`);

  let currentPhase = job.cursor?.phase || "posts";
  let postsNextUrl = job.cursor?.postsNextUrl || null;
  let videosNextUrl = job.cursor?.videosNextUrl || null;
  let postsFetched = job.cursor?.postsFetched || 0;
  let videosFetched = job.cursor?.videosFetched || 0;

  let postsAccumulator: CachedPost[] = [];
  let videosAccumulator: CachedPost[] = [];
  let timeLimitReached = false;

  // Phase 1: Scan Posts (limit is chunked max 100)
  if (currentPhase === "posts") {
    while (postsFetched < limit) {
      if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
        timeLimitReached = true;
        break;
      }
      try {
        const res = await fetchFacebookPosts(pageId, pageToken, 100, postsNextUrl);
        const rawPosts = res.data;
        if (rawPosts.length === 0) {
          currentPhase = "videos";
          break;
        }

        const mappedPosts: CachedPost[] = rawPosts.map((item: any) => ({
          id: item.id,
          pageId: pageId,
          pageName: pageCache.name,
          message: item.message || item.story || "",
          created_time: item.created_time,
          permalink_url: item.permalink_url || "",
          full_picture: item.full_picture || "",
          status_type: item.status_type || "status"
        }));

        postsAccumulator = postsAccumulator.concat(mappedPosts);
        postsFetched += mappedPosts.length;
        postsNextUrl = res.next || null;

        if (!postsNextUrl) {
          currentPhase = "videos";
          break;
        }
      } catch (e) {
        console.error("Error scanning posts:", e);
        currentPhase = "videos";
        break;
      }
    }
  }

  // Phase 2: Scan Videos (limit is chunked max 100)
  if (currentPhase === "videos" && !timeLimitReached) {
    while (videosFetched < limit) {
      if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
        timeLimitReached = true;
        break;
      }
      try {
        const res = await fetchFacebookVideos(pageId, pageToken, 100, videosNextUrl);
        const rawVideos = res.data;
        if (rawVideos.length === 0) {
          break;
        }

        const mappedVideos: CachedPost[] = rawVideos.map((item: any) => ({
          id: item.id,
          pageId: pageId,
          pageName: pageCache.name,
          message: item.title || item.description || "",
          created_time: item.created_time,
          permalink_url: item.permalink_url || "",
          full_picture: item.source || "",
          status_type: "added_video" // treat videos as added_video status_type
        }));

        videosAccumulator = videosAccumulator.concat(mappedVideos);
        videosFetched += mappedVideos.length;
        videosNextUrl = res.next || null;

        if (!videosNextUrl) {
          break;
        }
      } catch (e) {
        console.error("Error scanning videos:", e);
        break;
      }
    }
  }

  // Merge and Deduplicate cached posts
  const mergedItems = [...postsAccumulator, ...videosAccumulator];
  const deduplicatedItems: CachedPost[] = [];
  const seenIds = new Set<string>();
  for (const item of mergedItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      deduplicatedItems.push(item);
    }
  }

  const freshDb = readDb();
  const otherPagesPosts = freshDb.cached_posts.filter(p => p.pageId !== pageId);
  const existingPagePosts = freshDb.cached_posts.filter(p => p.pageId === pageId);

  const pagePostsMap = new Map<string, CachedPost>();
  for (const p of existingPagePosts) {
    pagePostsMap.set(p.id, p);
  }
  for (const p of deduplicatedItems) {
    pagePostsMap.set(p.id, p);
  }
  
  freshDb.cached_posts = [...otherPagesPosts, ...Array.from(pagePostsMap.values())];

  const dbJob = freshDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    const isJobPending = timeLimitReached && (currentPhase === "posts" || (currentPhase === "videos" && videosNextUrl));
    if (isJobPending) {
      dbJob.status = "pending";
      dbJob.cursor = {
        phase: currentPhase,
        postsNextUrl,
        videosNextUrl,
        postsFetched,
        videosFetched
      };
      dbJob.progress = Math.min(Math.round(((postsFetched + videosFetched) / (limit * 2)) * 100), 99);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.completed_at = new Date().toISOString();
      dbJob.processed_items = postsFetched + videosFetched;
      dbJob.total_items = limit;
      dbJob.success_items = postsFetched + videosFetched;
    }
    dbJob.updated_at = new Date().toISOString();
  }

  writeDb(freshDb);
}

// 3. Delete Posts/Videos Job (only if confirm === true)
async function handleDeletePosts(job: BackgroundJob, startTime: number): Promise<void> {
  const { dryRun, confirm } = job.payload;
  
  if (!confirm && !dryRun) {
    releaseLock(job.page_id, job.id);
    throw new Error("Yêu cầu xoá bị từ chối: Chưa xác nhận confirm=true");
  }

  const db = readDb();
  const pageCache = db.cached_pages.find(p => p.id === job.page_id);
  if (!pageCache) {
    releaseLock(job.page_id, job.id);
    throw new Error(`Page ${job.page_id} not found in DB cache.`);
  }

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  if (!pageToken && !dryRun) {
    releaseLock(job.page_id, job.id);
    throw new Error(`Access token missing for Page ${job.page_id}`);
  }

  let pendingIds: string[] = job.cursor?.pendingIds;
  if (!pendingIds) {
    pendingIds = [...job.payload.postIds];
  }

  let successCount = job.success_items || 0;
  let failedCount = job.failed_items || 0;

  const total = job.total_items || pendingIds.length;
  let timeLimitReached = false;

  const BATCH_SIZE = 5;

  while (pendingIds.length > 0) {
    if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
      timeLimitReached = true;
      break;
    }

    const batch = pendingIds.splice(0, BATCH_SIZE);
    
    const batchPromises = batch.map(async (itemId) => {
      if (dryRun) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return { itemId, success: true, status: "deleted" as const };
      }

      let attempt = 0;
      let backoffDelay = 500;
      while (attempt < 3) {
        try {
          const ok = await deleteFacebookItem(itemId, pageToken);
          if (ok) {
            return { itemId, success: true, status: "deleted" as const };
          }
          throw new Error("Meta API delete status false");
        } catch (e: any) {
          attempt++;
          const errMessage = e.message || "";
          
          if (errMessage.includes("expire") || errMessage.includes("Error validating access token") || errMessage.includes("OAuthException")) {
            return { itemId, success: false, status: "failed" as const, pauseJob: true, error: "Token expired" };
          }

          if (errMessage.includes("request limit") || errMessage.includes("rate limit") || errMessage.includes("613")) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            backoffDelay *= 2;
            continue;
          }

          if (attempt >= 3) {
            return { itemId, success: false, status: "failed" as const, error: errMessage };
          }
        }
      }
      return { itemId, success: false, status: "failed" as const, error: "Max attempts exceeded" };
    });

    const results = await Promise.all(batchPromises);
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    let shouldPause = false;
    let pauseError = "";
    
    const freshDb = readDb();
    for (const res of results) {
      if (res.success) {
        successCount++;
        const post = freshDb.cached_posts.find(p => p.id === res.itemId);
        if (post) post.delete_status = "deleted";
      } else {
        failedCount++;
        const post = freshDb.cached_posts.find(p => p.id === res.itemId);
        if (post) post.delete_status = "failed";
        if (res.pauseJob) {
          shouldPause = true;
          pauseError = res.error || "Token failure";
        }
      }
    }
    writeDb(freshDb);

    if (shouldPause) {
      const pausedDb = readDb();
      const dbJob = pausedDb.background_jobs.find(j => j.id === job.id);
      if (dbJob) {
        dbJob.status = "paused";
        dbJob.cursor = { pendingIds: [...batch.filter((_, idx) => !results[idx].success), ...pendingIds] };
        dbJob.processed_items = total - dbJob.cursor.pendingIds.length;
        dbJob.success_items = successCount;
        dbJob.failed_items = failedCount;
        dbJob.last_error = `Job paused: ${pauseError}`;
        dbJob.updated_at = new Date().toISOString();
      }
      writeDb(pausedDb);
      releaseLock(job.page_id, job.id);
      return;
    }
  }

  const finalDb = readDb();
  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    if (timeLimitReached && pendingIds.length > 0) {
      dbJob.status = "pending";
      dbJob.cursor = { pendingIds };
      dbJob.processed_items = total - pendingIds.length;
      dbJob.success_items = successCount;
      dbJob.failed_items = failedCount;
      dbJob.progress = Math.min(Math.round(((total - pendingIds.length) / total) * 100), 99);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.processed_items = total;
      dbJob.success_items = successCount;
      dbJob.failed_items = failedCount;
      dbJob.completed_at = new Date().toISOString();
    }
    dbJob.updated_at = new Date().toISOString();
  }
  writeDb(finalDb);
  
  if (!timeLimitReached || pendingIds.length === 0) {
    releaseLock(job.page_id, job.id);
  }
}

// 4. Check Page Access Job
async function handleCheckPageAccess(job: BackgroundJob): Promise<void> {
  const { pageId } = job.payload;
  const db = readDb();
  const pageCache = db.cached_pages.find(p => p.id === pageId);
  if (!pageCache) throw new Error(`Page ${pageId} not found in DB cache.`);

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  let accessStatus: CachedPage["access_status"] = "Bình thường";
  
  if (!pageToken) {
    accessStatus = "Token lỗi";
  } else {
    try {
      const checkUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}?fields=id,name,tasks&access_token=${pageToken}`;
      const data = await fbFetchJson(checkUrl);
      const tasks = data.tasks || [];
      const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
      const hasCreate = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");
      
      if (!hasManage || !hasCreate) {
        accessStatus = "Thiếu quyền";
      }
    } catch (e: any) {
      accessStatus = "Token lỗi";
    }
  }

  const finalDb = readDb();
  const page = finalDb.cached_pages.find(p => p.id === pageId);
  if (page) {
    page.access_status = accessStatus;
    page.last_synced_at = new Date().toISOString();
  }

  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    dbJob.status = "completed";
    dbJob.progress = 100;
    dbJob.completed_at = new Date().toISOString();
    dbJob.updated_at = new Date().toISOString();
  }

  writeDb(finalDb);
}

// 5. Refresh Avatar Job
async function handleRefreshAvatar(job: BackgroundJob): Promise<void> {
  const { pageId } = job.payload;
  const db = readDb();
  const pageCache = db.cached_pages.find(p => p.id === pageId);
  if (!pageCache) throw new Error(`Page ${pageId} not found in DB cache.`);

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  const avatarUrl = await fetchFacebookPageAvatar(pageId, pageToken);

  const finalDb = readDb();
  const page = finalDb.cached_pages.find(p => p.id === pageId);
  if (page && avatarUrl) {
    page.avatar_url = avatarUrl;
    page.last_synced_at = new Date().toISOString();
  }

  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    dbJob.status = "completed";
    dbJob.progress = 100;
    dbJob.completed_at = new Date().toISOString();
    dbJob.updated_at = new Date().toISOString();
  }
  writeDb(finalDb);
}

// 6. Refresh Page Stats Job
async function handleRefreshPageStats(job: BackgroundJob): Promise<void> {
  const { pageId } = job.payload;
  const db = readDb();
  const pageCache = db.cached_pages.find(p => p.id === pageId);
  if (!pageCache) throw new Error(`Page ${pageId} not found in DB cache.`);

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  try {
    const checkUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts?fields=id,likes.summary(true),comments.summary(true),shares&access_token=${pageToken}&limit=25`;
    const res = await fbFetchJson(checkUrl);
    const rawPosts = res.data || [];
    
    const finalDb = readDb();
    for (const item of rawPosts) {
      const post = finalDb.cached_posts.find(p => p.id === item.id);
      if (post) {
        post.likes = item.likes?.summary?.total_count || 0;
        post.comments = item.comments?.summary?.total_count || 0;
        post.shares = item.shares?.count || 0;
      }
    }
    
    const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
    if (dbJob) {
      dbJob.status = "completed";
      dbJob.progress = 100;
      dbJob.completed_at = new Date().toISOString();
      dbJob.updated_at = new Date().toISOString();
    }
    writeDb(finalDb);
  } catch (e) {
    console.error(`Error refreshing page stats:`, e);
    throw e;
  }
}

// Recovery function for Stalled Jobs
export function recoverStalledJobs(): { recoveredCount: number } {
  const db = readDb();
  const now = new Date();
  const STALL_TIMEOUT_MS = 60 * 1000;
  
  let recoveredCount = 0;
  
  for (const job of db.background_jobs) {
    if (job.status === "running") {
      const updatedAt = new Date(job.updated_at);
      if (now.getTime() - updatedAt.getTime() > STALL_TIMEOUT_MS) {
        job.status = job.attempt_count >= job.max_attempts ? "failed" : "pending";
        job.last_error = "Job stalled/heartbeat timed out.";
        job.updated_at = now.toISOString();
        
        releaseLock(job.page_id, job.id);
        recoveredCount++;
      }
    }
  }
  
  if (recoveredCount > 0) {
    writeDb(db);
  }
  return { recoveredCount };
}

// 7. Check API Access (Batch)
async function handleCheckApiAccess(job: BackgroundJob, startTime: number): Promise<void> {
  const { pageIds, userToken } = job.payload;
  if (!pageIds || !Array.isArray(pageIds)) throw new Error("Missing pageIds in check_api_access payload");

  let pendingPageIds = job.cursor?.pendingPageIds;
  if (!pendingPageIds) {
    pendingPageIds = [...pageIds];
  }

  const total = job.total_items || pageIds.length;
  let processed = job.processed_items || 0;
  let timeLimitReached = false;

  while (pendingPageIds.length > 0) {
    if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
      timeLimitReached = true;
      break;
    }

    const pageId = pendingPageIds.shift();
    if (!pageId) continue;

    const db = readDb();
    const pageCache = db.cached_pages.find(p => p.id === pageId);
    const pageAccessToken = pageCache?.access_token_encrypted 
      ? decrypt(pageCache.access_token_encrypted) 
      : "";
    const activeToken = pageAccessToken || userToken;

    let resultJson: any = null;
    let errorMessage: string | null = null;
    let status: "completed" | "failed" = "completed";

    if (!activeToken) {
      status = "failed";
      errorMessage = "Missing access token";
      resultJson = {
        pageId,
        name: pageCache?.name || "Không xác định",
        category: pageCache?.category || "Không xác định",
        tasks: pageCache?.tasks || [],
        status: "Token lỗi / hết hạn",
        detail: "Không tìm thấy token truy cập Fanpage.",
        hasPageAccessToken: false,
        postsSuccess: false,
        postsCountFetched: 0,
        postSample: null,
        checkedAt: new Date().toISOString()
      };
    } else {
      try {
        const infoUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}?fields=id,name,category,tasks&access_token=${activeToken}`;
        let pageInfo: any = null;
        let infoError: string | null = null;
        let isOAuthError = false;
        let isPermissionError = false;
        let tasks: string[] = [];

        try {
          const data = await fbFetchJson(infoUrl);
          pageInfo = data;
          tasks = data.tasks || [];
        } catch (e: any) {
          const errMsg = e.message || "";
          infoError = errMsg;
          if (errMsg.includes("OAuthException") || errMsg.includes("expired") || errMsg.includes("session")) {
            isOAuthError = true;
          }
          if (errMsg.includes("permission") || errMsg.includes("privilege") || errMsg.includes("tasks")) {
            isPermissionError = true;
          }
        }

        let postsSuccess = false;
        let postsError: string | null = null;
        let postSample: any = null;

        if (!infoError || infoError.indexOf("OAuth") === -1) {
          const postsUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=1&access_token=${activeToken}`;
          try {
            const postsData = await fbFetchJson(postsUrl);
            postsSuccess = true;
            if (postsData.data && postsData.data.length > 0) {
              postSample = postsData.data[0];
            }
          } catch (e: any) {
            postsError = e.message || "";
            if (postsError.includes("permission") || postsError.includes("tasks") || postsError.includes("privilege")) {
              isPermissionError = true;
            }
          }
        }

        const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
        const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("MANAGE") || tasks.includes("pages_manage_posts");

        let pageStatus = "Bình thường";
        let detail = "Hoạt động bình thường";

        if (isOAuthError || (infoError && (infoError.includes("OAuth") || infoError.includes("session") || infoError.includes("expired")))) {
          pageStatus = "Token lỗi / hết hạn";
          detail = infoError || "Mã truy cập fanpage đã hết hạn hoặc không hợp lệ.";
        } else if (isPermissionError || (infoError && (infoError.includes("permission") || infoError.includes("tasks")))) {
          pageStatus = "Thiếu quyền";
          detail = infoError || "Tài khoản không đủ quyền truy cập API Fanpage.";
        } else if (tasks.length > 0 && !hasManage) {
          pageStatus = "Thiếu quyền";
          detail = "Tài khoản thiếu quyền quản trị cấp độ MANAGE trên trang.";
        } else if (tasks.length > 0 && !hasCreateContent) {
          pageStatus = "Thiếu quyền";
          detail = "Tài khoản thiếu quyền đăng hoặc xóa bài viết (CREATE_CONTENT).";
        } else if (postsError) {
          pageStatus = "Không lấy được bài";
          detail = `Tìm bài viết lỗi: ${postsError}`;
        } else if (!pageInfo) {
          pageStatus = "Cần kiểm tra thủ công";
          detail = infoError || "Không lấy được thông tin chi tiết qua API.";
        }

        if (infoError && (infoError.includes("restricted") || infoError.includes("disabled") || infoError.includes("status"))) {
          pageStatus = "Nghi bị hạn chế";
          detail = infoError;
        }

        resultJson = {
          pageId,
          name: pageInfo?.name || pageCache?.name || "Không xác định",
          category: pageInfo?.category || pageCache?.category || "Không xác định",
          tasks,
          status: pageStatus,
          detail,
          hasPageAccessToken: !!pageAccessToken,
          postsSuccess,
          postsCountFetched: postSample ? 1 : 0,
          postSample,
          checkedAt: new Date().toISOString()
        };
      } catch (err: any) {
        status = "failed";
        errorMessage = err.message || "";
        resultJson = {
          pageId,
          name: pageCache?.name || "Không xác định",
          category: pageCache?.category || "Không xác định",
          tasks: pageCache?.tasks || [],
          status: "Token lỗi / hết hạn",
          detail: err.message || "Lỗi máy chủ khi quét.",
          hasPageAccessToken: !!pageAccessToken,
          postsSuccess: false,
          postsCountFetched: 0,
          postSample: null,
          checkedAt: new Date().toISOString()
        };
      }
    }

    const freshDb = readDb();
    let resultRecord = freshDb.job_results.find(r => r.job_id === job.id && r.page_id === pageId);
    if (!resultRecord) {
      resultRecord = {
        id: Math.random().toString(36).substring(2, 11),
        job_id: job.id,
        page_id: pageId,
        item_type: "check_api_access",
        status: status,
        progress: 100,
        result_json: resultJson,
        error_message: errorMessage,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      freshDb.job_results.push(resultRecord);
    } else {
      resultRecord.status = status;
      resultRecord.result_json = resultJson;
      resultRecord.error_message = errorMessage;
      resultRecord.completed_at = new Date().toISOString();
      resultRecord.updated_at = new Date().toISOString();
    }

    if (resultJson) {
      const pCache = freshDb.cached_pages.find(p => p.id === pageId);
      if (pCache) {
        pCache.access_status = resultJson.status;
        pCache.last_synced_at = new Date().toISOString();
      }
    }

    processed++;
    const dbJob = freshDb.background_jobs.find(j => j.id === job.id);
    if (dbJob) {
      dbJob.processed_items = processed;
      dbJob.success_items = dbJob.success_items + (status === "completed" ? 1 : 0);
      dbJob.failed_items = dbJob.failed_items + (status === "failed" ? 1 : 0);
      dbJob.progress = Math.round((processed / total) * 100);
      dbJob.updated_at = new Date().toISOString();
    }
    writeDb(freshDb);
  }

  const finalDb = readDb();
  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    if (timeLimitReached && pendingPageIds.length > 0) {
      dbJob.status = "pending";
      dbJob.cursor = { pendingPageIds };
      console.log(`Job ${job.id} check_api_access execution paused. Cursor saved.`);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.completed_at = new Date().toISOString();
      console.log(`Job ${job.id} check_api_access completed!`);
    }
    dbJob.updated_at = new Date().toISOString();
    writeDb(finalDb);
  }
}

// 8. Scan Page Admins / Business Manager
async function handleScanPageAdmins(job: BackgroundJob, startTime: number): Promise<void> {
  const { pageIds, userToken } = job.payload;
  if (!pageIds || !Array.isArray(pageIds)) throw new Error("Missing pageIds in scan_page_admins payload");

  let pendingPageIds = job.cursor?.pendingPageIds;
  let pageToBmMap = job.cursor?.pageToBmMap || null;
  let hasBmPermission = job.cursor?.hasBmPermission !== false;

  const total = job.total_items || pageIds.length;
  let processed = job.processed_items || 0;
  let timeLimitReached = false;

  if (pageToBmMap === null) {
    pageToBmMap = {};
    try {
      const bmUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/me/businesses?fields=id,name,primary_page&access_token=${userToken}&limit=100`;
      const bmData = await fbFetchJson(bmUrl);
      
      if (bmData.error) {
        const errMsg = bmData.error.message || "";
        if (errMsg.includes("OAuthException") || errMsg.includes("permission") || errMsg.includes("required")) {
          hasBmPermission = false;
        }
      } else {
        const bmList = bmData.data || [];
        for (const bm of bmList) {
          try {
            const ownedUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${bm.id}/owned_pages?fields=id,name&access_token=${userToken}&limit=100`;
            const clientUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${bm.id}/client_pages?fields=id,name&access_token=${userToken}&limit=100`;

            const [ownedData, clientData] = await Promise.all([
              fbFetchJson(ownedUrl).catch(() => ({ data: [] })),
              fbFetchJson(clientUrl).catch(() => ({ data: [] }))
            ]);

            (ownedData.data || []).forEach((p: any) => {
              pageToBmMap[p.id] = { businessName: bm.name, businessId: bm.id, type: "Owned Page" };
            });
            (clientData.data || []).forEach((p: any) => {
              pageToBmMap[p.id] = { businessName: bm.name, businessId: bm.id, type: "Client Page" };
            });
          } catch (e) {
            console.error(`Error mapping pages for business ${bm.id}:`, e);
          }
        }
      }
    } catch (e: any) {
      console.error("Error loading businesses:", e);
      hasBmPermission = false;
    }
  }

  if (!pendingPageIds) {
    pendingPageIds = [...pageIds];
  }

  while (pendingPageIds.length > 0) {
    if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
      timeLimitReached = true;
      break;
    }

    const pageId = pendingPageIds.shift();
    if (!pageId) continue;

    const db = readDb();
    const pageCache = db.cached_pages.find(p => p.id === pageId);
    const pageAccessToken = pageCache?.access_token_encrypted 
      ? decrypt(pageCache.access_token_encrypted) 
      : "";
    const hasPageToken = !!pageAccessToken;

    const tasks = pageCache?.tasks || [];
    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreateContent = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");

    let status: "Bình thường" | "Thiếu quyền" | "Token lỗi" = "Bình thường";
    let detail = "Đầy đủ quyền tác vụ cơ bản";

    if (!hasPageToken) {
      status = "Token lỗi";
      detail = "Thiếu Page Access Token hoặc đã bị hỏng";
    } else if (!hasManage) {
      status = "Thiếu quyền";
      detail = "Thiếu quyền quản lý (MANAGE)";
    } else if (!hasCreateContent) {
      status = "Thiếu quyền";
      detail = "Thiếu quyền đăng/xóa bài (CREATE_CONTENT)";
    }

    const mapInfo = pageToBmMap[pageId];

    const resultJson = {
      pageId,
      name: pageCache?.name || "Không xác định",
      category: pageCache?.category || "Không xác định",
      tasks,
      businessName: mapInfo ? mapInfo.businessName : "N/A",
      businessId: mapInfo ? mapInfo.businessId : "N/A",
      businessType: mapInfo ? mapInfo.type : "Không xác định",
      status,
      detail,
      hasBmPermission,
      lastCheckedAt: new Date().toISOString()
    };

    const freshDb = readDb();
    let resultRecord = freshDb.job_results.find(r => r.job_id === job.id && r.page_id === pageId);
    if (!resultRecord) {
      resultRecord = {
        id: Math.random().toString(36).substring(2, 11),
        job_id: job.id,
        page_id: pageId,
        item_type: "scan_page_admins",
        status: "completed",
        progress: 100,
        result_json: resultJson,
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      freshDb.job_results.push(resultRecord);
    } else {
      resultRecord.status = "completed";
      resultRecord.result_json = resultJson;
      resultRecord.completed_at = new Date().toISOString();
      resultRecord.updated_at = new Date().toISOString();
    }

    processed++;
    const dbJob = freshDb.background_jobs.find(j => j.id === job.id);
    if (dbJob) {
      dbJob.processed_items = processed;
      dbJob.success_items = dbJob.success_items + 1;
      dbJob.progress = Math.round((processed / total) * 100);
      dbJob.updated_at = new Date().toISOString();
    }
    writeDb(freshDb);
  }

  const finalDb = readDb();
  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    if (timeLimitReached && pendingPageIds.length > 0) {
      dbJob.status = "pending";
      dbJob.cursor = { pendingPageIds, pageToBmMap, hasBmPermission };
      console.log(`Job ${job.id} scan_page_admins execution paused. Cursor saved.`);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.completed_at = new Date().toISOString();
      console.log(`Job ${job.id} scan_page_admins completed!`);
    }
    dbJob.updated_at = new Date().toISOString();
    writeDb(finalDb);
  }
}
