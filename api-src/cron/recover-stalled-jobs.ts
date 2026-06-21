import { recoverStalledJobs } from "../worker";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const result = recoverStalledJobs();
    return res.status(200).json({
      success: true,
      message: "Cron recovered stalled background jobs successfully",
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to recover stalled jobs in cron" });
  }
}
