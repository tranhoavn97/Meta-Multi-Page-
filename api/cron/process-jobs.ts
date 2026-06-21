import { processJobs } from "../worker";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const result = await processJobs();
    return res.status(200).json({
      success: true,
      message: "Cron processed background jobs successfully",
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to process jobs in cron" });
  }
}
