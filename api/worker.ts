import { 
  readDb, writeDb, encrypt, decrypt, acquireLock, releaseLock, releaseAllExpiredLocks, 
  BackgroundJob, CachedPage, CachedPost 
} from "./db";

const MAX_CONCURRENT_JOBS = 4;
const MAX_INVOCATION_TIME_MS = 8000; // Chunk execution to fit in Vercel's execution limits

// Helper function to fetch JSON securely on the backend
async function fbFetchJson(url: string, options: any = {}): Promise<any> {
  const res = await fetch(url, options);
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

  // Clean and fetch active jobs
  const runningJobs = db.background_jobs.filter(j => j.status === "running");
  const pendingJobs = db.background_jobs.filter(j => j.status === "pending" || j.status === "queued");

  let processedCount = 0;

  // If we have capacity for more jobs, start running pending ones
  if (runningJobs.length < MAX_CONCURRENT_JOBS && pendingJobs.length > 0) {
    // Sort by priority (higher priority first)
    pendingJobs.sort((a, b) => b.priority - a.priority);

    for (const job of pendingJobs) {
      if (db.background_jobs.filter(j => j.status === "running").length >= MAX_CONCURRENT_JOBS) {
        break;
      }

      // Deletion jobs need a page-level lock to prevent simultaneous deletes on the same page
      if (job.type === "delete_posts") {
        const canLock = acquireLock(job.page_id, job.id, "delete", 120); // 2 minute lock
        if (!canLock) {
          console.log(`Job ${job.id} for Page ${job.page_id} skipped: Lock active.`);
          continue; 
        }
      }

      // Mark job as running
      const dbJob = db.background_jobs.find(j => j.id === job.id);
      if (dbJob) {
        dbJob.status = "running";
        dbJob.started_at = now.toISOString();
        dbJob.updated_at = now.toISOString();
        dbJob.attempt_count += 1;
        writeDb(db);
        
        // Execute the job asynchronously
        executeJobAsync(job.id);
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

  const url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture.type(large),access_token,tasks&access_token=${userToken}&limit=100`;
  const data = await fbFetchJson(url);
  const fbPages = data.data || [];

  const db = readDb();

  // Parallel fetch picture fallbacks if needed
  const pagesWithPictures = await Promise.all(
    fbPages.map(async (page: any) => {
      if (page.picture?.data?.url) return page;
      try {
        const fallbackUrl = `https://graph.facebook.com/v19.0/${page.id}/picture?type=large&redirect=false&access_token=${page.access_token || userToken}`;
        const picRes = await fbFetchJson(fallbackUrl);
        if (picRes.data?.url) {
          page.picture = { data: { url: picRes.data.url } };
        }
      } catch (e) {
        console.error(`Error fetching page ${page.id} fallback avatar:`, e);
      }
      return page;
    })
  );

  // Sync with cached pages database
  const syncedPages: CachedPage[] = pagesWithPictures.map((page: any) => {
    // Determine access status
    const tasks = page.tasks || [];
    const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
    const hasCreate = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");
    let accessStatus: CachedPage["access_status"] = "Bình thường";
    if (!page.access_token) {
      accessStatus = "Token lỗi";
    } else if (!hasManage || !hasCreate) {
      accessStatus = "Thiếu quyền";
    }

    // Determine monetization status based on actual API response fields
    let monetizationStatus = "Chưa xác định";
    if (page.monetization_status !== undefined || page.is_monetized !== undefined || page.monetization_enabled !== undefined) {
      const specVal = page.monetization_status || page.is_monetized || page.monetization_enabled;
      monetizationStatus = `Đặc biệt: ${specVal}`;
    } else if (accessStatus === "Token lỗi" || accessStatus === "Thiếu quyền") {
      monetizationStatus = "Không đủ quyền kiểm tra";
    } else {
      monetizationStatus = "Chưa xác định";
    }

    return {
      id: page.id,
      name: page.name,
      avatar_url: page.picture?.data?.url || "",
      access_status: accessStatus,
      tasks: page.tasks || [],
      last_synced_at: new Date().toISOString(),
      access_token_encrypted: encrypt(page.access_token || ""),
      category: page.category || "",
      monetization_status: monetizationStatus
    };
  });

  // Re-save pages cache in DB
  db.cached_pages = syncedPages;

  // Complete job
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

// 2. Scan Posts Job
async function handleScanPosts(job: BackgroundJob, startTime: number): Promise<void> {
  const { pageId, limit } = job.payload;
  const db = readDb();
  
  const pageCache = db.cached_pages.find(p => p.id === pageId);
  if (!pageCache) throw new Error(`Page ${pageId} not found in DB cache.`);

  const pageToken = pageCache.access_token_encrypted 
    ? decrypt(pageCache.access_token_encrypted) 
    : "";

  if (!pageToken) throw new Error(`Access token missing for Page ${pageId}`);

  // Retrieve paging cursor
  let currentCursorUrl = job.cursor?.nextUrl;
  let fetchedCount = job.cursor?.fetchedCount || 0;
  let postsAccumulator: CachedPost[] = [];

  if (!currentCursorUrl && fetchedCount === 0) {
    currentCursorUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,permalink_url,full_picture,status_type,likes.summary(true),comments.summary(true),shares&access_token=${pageToken}&limit=100`;
  }

  let nextUrl: string | null = currentCursorUrl;
  let timeLimitReached = false;

  while (nextUrl && fetchedCount < limit) {
    if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
      timeLimitReached = true;
      break;
    }

    const data = await fbFetchJson(nextUrl);
    const rawPosts = data.data || [];
    if (rawPosts.length === 0) break;

    const mappedPosts: CachedPost[] = rawPosts.map((item: any) => ({
      id: item.id,
      pageId: pageId,
      pageName: pageCache.name,
      message: item.message || "",
      created_time: item.created_time,
      permalink_url: item.permalink_url || "",
      full_picture: item.full_picture || "",
      status_type: item.status_type || "",
      likes: item.likes?.summary?.total_count || 0,
      comments: item.comments?.summary?.total_count || 0,
      shares: item.shares?.count || 0
    }));

    postsAccumulator = postsAccumulator.concat(mappedPosts);
    fetchedCount += mappedPosts.length;
    nextUrl = data.paging?.next || null;
  }

  // Update DB cache
  const freshDb = readDb();
  // Filter out existing cached posts of this Page and save the rest
  const otherPosts = freshDb.cached_posts.filter(p => p.pageId !== pageId);
  freshDb.cached_posts = [...otherPosts, ...postsAccumulator];

  // Save state
  const dbJob = freshDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    if (timeLimitReached && nextUrl) {
      dbJob.status = "pending"; // Re-queue to continue
      dbJob.cursor = { nextUrl, fetchedCount };
      dbJob.progress = Math.min(Math.round((fetchedCount / limit) * 100), 99);
      console.log(`Scan job ${job.id} split. Fetched ${fetchedCount}/${limit}. Saved cursor.`);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.completed_at = new Date().toISOString();
      dbJob.processed_items = fetchedCount;
      dbJob.total_items = limit;
      dbJob.success_items = fetchedCount;
      console.log(`Scan job ${job.id} completed. Total fetched: ${fetchedCount}`);
    }
    dbJob.updated_at = new Date().toISOString();
  }

  writeDb(freshDb);
}

// 3. Delete Posts Job
async function handleDeletePosts(job: BackgroundJob, startTime: number): Promise<void> {
  const { dryRun } = job.payload;
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

  // Get list of remaining post IDs
  let pendingIds: string[] = job.cursor?.pendingIds;
  if (!pendingIds) {
    pendingIds = [...job.payload.postIds];
  }

  let successCount = job.success_items || 0;
  let failedCount = job.failed_items || 0;
  let skippedCount = job.processed_items - (successCount + failedCount) || 0;

  const total = job.total_items || pendingIds.length;
  let timeLimitReached = false;

  console.log(`Job ${job.id}: Deleting ${pendingIds.length} remaining posts on Page ${pageCache.name}`);

  // Process posts in batches of 5
  const BATCH_SIZE = 5;

  while (pendingIds.length > 0) {
    if (Date.now() - startTime > MAX_INVOCATION_TIME_MS) {
      timeLimitReached = true;
      break;
    }

    const batch = pendingIds.splice(0, BATCH_SIZE);
    
    // Process batch with concurrency limit of 2
    const batchPromises = batch.map(async (postId) => {
      if (dryRun) {
        console.log(`[DRY RUN] Delete post ${postId} on Page ${job.page_id}`);
        // Delay slightly to simulate action
        await new Promise(resolve => setTimeout(resolve, 150));
        return { postId, success: true, status: "deleted" as const };
      }

      let attempt = 0;
      let backoffDelay = 500;
      while (attempt < 3) {
        try {
          const deleteUrl = `https://graph.facebook.com/v19.0/${postId}?access_token=${pageToken}`;
          const res = await fbFetchJson(deleteUrl, { method: "DELETE" });
          if (res.success) {
            return { postId, success: true, status: "deleted" as const };
          }
          throw new Error("Meta API delete status false");
        } catch (e: any) {
          attempt++;
          const errMessage = e.message || "";
          
          // Check token expiry issues
          if (errMessage.includes("expire") || errMessage.includes("Error validating access token") || errMessage.includes("OAuthException")) {
            return { postId, success: false, status: "failed" as const, pauseJob: true, error: "Token expired" };
          }

          // Rate limit checks (Error code 613, 17, 32, etc.)
          if (errMessage.includes("request limit") || errMessage.includes("rate limit") || errMessage.includes("613")) {
            console.log(`Rate limit met. Backing off for ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            backoffDelay *= 2; // exponential backoff
            continue;
          }

          if (attempt >= 3) {
            return { postId, success: false, status: "failed" as const, error: errMessage };
          }
        }
      }
      return { postId, success: false, status: "failed" as const, error: "Max attempts exceeded" };
    });

    const results = await Promise.all(batchPromises);

    // Apply random delay between batches (300-800ms)
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    // Process batch results
    let shouldPause = false;
    let pauseError = "";
    
    const freshDb = readDb();
    for (const res of results) {
      if (res.success) {
        successCount++;
        // Update post delete status in DB cache
        const post = freshDb.cached_posts.find(p => p.id === res.postId);
        if (post) post.delete_status = "deleted";
      } else {
        failedCount++;
        const post = freshDb.cached_posts.find(p => p.id === res.postId);
        if (post) post.delete_status = "failed";
        if (res.pauseJob) {
          shouldPause = true;
          pauseError = res.error || "Token failure";
        }
      }
    }
    writeDb(freshDb);

    if (shouldPause) {
      // Pause job due to credentials failure
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

  // Final job state update
  const finalDb = readDb();
  const dbJob = finalDb.background_jobs.find(j => j.id === job.id);
  if (dbJob) {
    if (timeLimitReached && pendingIds.length > 0) {
      dbJob.status = "pending"; // Put back to queue to continue
      dbJob.cursor = { pendingIds };
      dbJob.processed_items = total - pendingIds.length;
      dbJob.success_items = successCount;
      dbJob.failed_items = failedCount;
      dbJob.progress = Math.min(Math.round(((total - pendingIds.length) / total) * 100), 99);
      console.log(`Delete job ${job.id} split. Processed ${dbJob.processed_items}/${total}.`);
    } else {
      dbJob.status = "completed";
      dbJob.cursor = null;
      dbJob.progress = 100;
      dbJob.processed_items = total;
      dbJob.success_items = successCount;
      dbJob.failed_items = failedCount;
      dbJob.completed_at = new Date().toISOString();
      console.log(`Delete job ${job.id} completed. Success: ${successCount}, Failed: ${failedCount}`);
    }
    dbJob.updated_at = new Date().toISOString();
  }
  writeDb(finalDb);
  
  // Release lock on completion or pause
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
      // Fetch dynamic page details to check token status
      const checkUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,tasks&access_token=${pageToken}`;
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

  // Update DB Cache
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

  let avatarUrl = "";
  try {
    const fallbackUrl = `https://graph.facebook.com/v19.0/${pageId}/picture?type=large&redirect=false&access_token=${pageToken}`;
    const picRes = await fbFetchJson(fallbackUrl);
    if (picRes.data?.url) {
      avatarUrl = picRes.data.url;
    }
  } catch (e) {
    console.error(`Error refreshing avatar for page ${pageId}:`, e);
  }

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
    // Simply fetches the posts of the page to refresh stats in cache
    const checkUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,likes.summary(true),comments.summary(true),shares&access_token=${pageToken}&limit=25`;
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
  const STALL_TIMEOUT_MS = 60 * 1000; // 1 minute of inactivity
  
  let recoveredCount = 0;
  
  for (const job of db.background_jobs) {
    if (job.status === "running") {
      const updatedAt = new Date(job.updated_at);
      if (now.getTime() - updatedAt.getTime() > STALL_TIMEOUT_MS) {
        // Mark job as stalled/pending to retry
        job.status = job.attempt_count >= job.max_attempts ? "failed" : "pending";
        job.last_error = "Job stalled/heartbeat timed out.";
        job.updated_at = now.toISOString();
        
        // Release locks
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
        const infoUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,category,tasks&access_token=${activeToken}`;
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
          const postsUrl = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=1&access_token=${activeToken}`;
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
      const bmUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name,primary_page&access_token=${userToken}&limit=100`;
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
            const ownedUrl = `https://graph.facebook.com/v19.0/${bm.id}/owned_pages?fields=id,name&access_token=${userToken}&limit=100`;
            const clientUrl = `https://graph.facebook.com/v19.0/${bm.id}/client_pages?fields=id,name&access_token=${userToken}&limit=100`;

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
