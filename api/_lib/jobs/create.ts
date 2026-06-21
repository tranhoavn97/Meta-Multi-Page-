import { readDb, writeDb, BackgroundJob } from "../db.js";
import { processJobs } from "../worker.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Only POST requests allowed" });
  }

  const { type, pageId, payload } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Missing job type" });
  }

  try {
    const db = readDb();

    // Section 12: Check conflict / duplicate job
    let existingJob: any = null;
    const reqPageIds = req.body.pageIds || payload?.pageIds;
    if (pageId && pageId !== "system") {
      existingJob = db.background_jobs.find(j => 
        j.type === type && 
        j.page_id === pageId && 
        (j.status === "running" || j.status === "pending" || j.status === "queued")
      );
    } else if (reqPageIds && Array.isArray(reqPageIds)) {
      existingJob = db.background_jobs.find(j => 
        j.type === type && 
        (j.status === "running" || j.status === "pending" || j.status === "queued") &&
        j.payload && Array.isArray(j.payload.pageIds) &&
        j.payload.pageIds.length === reqPageIds.length &&
        j.payload.pageIds.every((id: string) => reqPageIds.includes(id))
      );
    }

    if (existingJob) {
      // Trigger worker asynchronously to ensure it is running
      processJobs().catch(e => console.error("Worker trigger error:", e));
      return res.status(200).json({
        success: true,
        jobId: existingJob.id
      });
    }
    
    // For delete_posts, check pages_manage_posts first
    if (type === "delete_posts") {
      const page = db.cached_pages.find(p => p.id === pageId);
      if (page) {
        const tasks = page.tasks || [];
        const hasDeletePerm = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE");
        if (!hasDeletePerm) {
          return res.status(403).json({ error: "Thiếu quyền pages_manage_posts hoặc CREATE_CONTENT trên Fanpage để xoá bài." });
        }
      }
    }

    const jobId = Math.random().toString(36).substring(2, 11);
    const now = new Date();
    
    const jobPayload = {
      ...(payload || {}),
      pageIds: reqPageIds || [],
      options: req.body.options || payload?.options || {},
      userToken: req.body.userToken || req.body.user_token || payload?.userToken || req.query?.user_token || ""
    };

    const newJob: BackgroundJob = {
      id: jobId,
      type,
      page_id: pageId || "system",
      status: "pending",
      priority: type === "delete_posts" ? 10 : 5,
      payload: jobPayload,
      cursor: null,
      progress: 0,
      total_items: type === "delete_posts" 
        ? (jobPayload.postIds?.length || 0) 
        : (jobPayload.pageIds?.length || 0),
      processed_items: 0,
      success_items: 0,
      failed_items: 0,
      attempt_count: 0,
      max_attempts: 3,
      next_run_at: now.toISOString(),
      started_at: null,
      completed_at: null,
      last_error: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    db.background_jobs.push(newJob);
    writeDb(db);

    // Trigger worker asynchronously to run the job
    processJobs().catch(e => console.error("Worker trigger error:", e));

    return res.status(200).json({
      success: true,
      jobId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to create job" });
  }
}
