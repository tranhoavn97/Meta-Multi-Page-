import { readDb } from "../db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const jobId = (req.query.id || req.query.jobId) as string;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const db = readDb();
    const job = db.background_jobs.find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Hide tokens in payload before returning to frontend
    const cleanPayload = { ...job.payload };
    if (cleanPayload.userToken) delete cleanPayload.userToken;
    if (cleanPayload.pageAccessToken) delete cleanPayload.pageAccessToken;

    const pageCache = db.cached_pages.find(p => p.id === job.page_id);

    return res.status(200).json({
      success: true,
      job: {
        ...job,
        payload: cleanPayload,
        pageName: pageCache ? pageCache.name : "Hệ thống"
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch job status" });
  }
}
