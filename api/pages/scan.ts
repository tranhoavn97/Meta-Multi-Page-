import { readDb, writeDb, BackgroundJob } from "../db";
import { processJobs } from "../worker";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Only POST requests allowed" });
  }

  const pageId = (req.query.pageId || req.query.page_id || req.body?.pageId) as string;
  const limit = parseInt((req.query.limit || req.body?.limit || "1000") as string, 10);

  if (!pageId) {
    return res.status(400).json({ error: "Missing pageId parameter" });
  }

  try {
    const db = readDb();
    const page = db.cached_pages.find(p => p.id === pageId);
    if (!page) {
      return res.status(404).json({ error: `Page ${pageId} not found in DB cache. Run pages sync first.` });
    }

    // Check if there is already an active scan job for this page
    const activeScan = db.background_jobs.find(j => 
      j.page_id === pageId && j.type === "scan_posts" && ["pending", "queued", "running"].includes(j.status)
    );

    if (activeScan) {
      return res.status(200).json({
        success: true,
        message: "Scan posts job is already active for this Page",
        jobId: activeScan.id
      });
    }

    const jobId = Math.random().toString(36).substring(2, 11);
    const newJob: BackgroundJob = {
      id: jobId,
      type: "scan_posts",
      page_id: pageId,
      status: "pending",
      priority: 6,
      payload: { pageId, limit },
      cursor: null,
      progress: 0,
      total_items: limit,
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
      message: "Scan posts job scheduled",
      jobId
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to trigger scan posts job" });
  }
}
