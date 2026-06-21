import { readDb, writeDb } from "../db.js";
import { processJobs } from "../worker.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(455).json({ error: "Only POST requests allowed" });
  }

  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const db = readDb();
    const job = db.background_jobs.find(j => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === "paused") {
      job.status = "pending";
      job.updated_at = new Date().toISOString();
      writeDb(db);
      
      // Trigger worker to start processing again
      processJobs().catch(e => console.error("Worker trigger error:", e));

      return res.status(200).json({ success: true, message: "Job resumed successfully" });
    }

    return res.status(400).json({ error: `Cannot resume job with status: ${job.status}` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to resume job" });
  }
}
