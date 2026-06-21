import { readDb } from "../db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const db = readDb();
    
    // Retrieve jobs that are currently running, pending, queued, or paused
    const activeJobs = db.background_jobs
      .filter(j => ["pending", "queued", "running", "paused"].includes(j.status))
      .map(job => {
        const cleanPayload = { ...job.payload };
        if (cleanPayload.userToken) delete cleanPayload.userToken;
        if (cleanPayload.pageAccessToken) delete cleanPayload.pageAccessToken;
        
        const pageCache = db.cached_pages.find(p => p.id === job.page_id);
        
        return {
          ...job,
          payload: cleanPayload,
          pageName: pageCache ? pageCache.name : "Hệ thống"
        };
      });

    return res.status(200).json({
      success: true,
      jobs: activeJobs
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch active jobs" });
  }
}
