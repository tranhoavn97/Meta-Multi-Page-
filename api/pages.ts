import { readDb, writeDb, BackgroundJob } from "./db";
import { processJobs } from "./worker";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const db = readDb();
    const summary = req.query.summary === "true";
    const userToken = (req.query.user_token || req.query.userToken || req.body?.userToken) as string;

    const cachedPages = db.cached_pages || [];

    // Check if cache is stale (older than 5 minutes or empty)
    const STALE_TIME_MS = 5 * 60 * 1000;
    const isCacheStale = cachedPages.length === 0 || 
      cachedPages.some(p => !p.last_synced_at || (Date.now() - new Date(p.last_synced_at).getTime() > STALE_TIME_MS));

    // If cache is stale and token is provided, trigger sync job in the background (Stale-While-Revalidate)
    if (isCacheStale && userToken) {
      console.log("Pages cache is stale or empty. Triggering background sync_pages job...");
      
      // Check if there is already a pending/running sync job to avoid duplicates
      const hasActiveSync = db.background_jobs.some(j => 
        j.type === "sync_pages" && ["pending", "queued", "running"].includes(j.status)
      );

      if (!hasActiveSync) {
        const jobId = Math.random().toString(36).substring(2, 11);
        const newJob: BackgroundJob = {
          id: jobId,
          type: "sync_pages",
          page_id: "system",
          status: "pending",
          priority: 5,
          payload: { userToken },
          cursor: null,
          progress: 0,
          total_items: 1,
          processed_items: 0,
          success_items: 0,
          failed_items: 0,
          attempt_count: 0,
          max_attempts: 3,
          next_run_at: new Date().toISOString(),
          started_at: null,
          completed_at: null,
          last_error: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.background_jobs.push(newJob);
        writeDb(db);
        
        // Trigger worker asynchronously
        processJobs().catch(e => console.error("Worker trigger error:", e));
      }
    }

    // Map output fields
    const outputPages = cachedPages.map(page => {
      if (summary) {
        return {
          id: page.id,
          name: page.name,
          avatar_url: page.avatar_url,
          access_status: page.access_status,
          tasks: page.tasks,
          last_synced_at: page.last_synced_at,
          monetization_status: page.monetization_status || "Chưa xác định"
        };
      }
      
      // Never return the access token to the frontend
      const cleanPage = { ...page };
      if (cleanPage.access_token_encrypted) delete cleanPage.access_token_encrypted;
      cleanPage.monetization_status = page.monetization_status || "Chưa xác định";
      return cleanPage;
    });

    return res.status(200).json({ data: outputPages });
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách Fanpages:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy trang" });
  }
}
