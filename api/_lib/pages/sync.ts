import { readDb, writeDb, BackgroundJob } from "../db.js";
import { processJobs } from "../worker.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Only POST requests allowed" });
  }

  const { userToken } = req.body;
  if (!userToken) {
    return res.status(400).json({ error: "Missing userToken in request body" });
  }

  try {
    const db = readDb();
    
    // Check for existing active sync job
    const activeSync = db.background_jobs.find(j => 
      j.type === "sync_pages" && ["pending", "queued", "running"].includes(j.status)
    );

    if (activeSync) {
      return res.status(200).json({
        success: true,
        message: "Sync pages job is already active",
        jobId: activeSync.id
      });
    }

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

    processJobs().catch(e => console.error("Worker trigger error:", e));

    return res.status(200).json({
      success: true,
      message: "Sync pages job scheduled",
      jobId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to trigger pages sync" });
  }
}
