import { readDb } from "../db";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const jobId = (req.query.id || req.query.jobId) as string;
  if (!jobId) {
    return res.status(400).json({ error: "Missing jobId parameter" });
  }

  try {
    const db = readDb();
    const results = db.job_results.filter(r => r.job_id === jobId);
    
    // Safety check: clean any access tokens if present in result_json
    const cleanResults = results.map(r => {
      const cleanR = { ...r };
      if (cleanR.result_json && typeof cleanR.result_json === "object") {
        const cleanJson = { ...cleanR.result_json };
        if (cleanJson.accessToken) delete cleanJson.accessToken;
        if (cleanJson.pageAccessToken) delete cleanJson.pageAccessToken;
        if (cleanJson.userToken) delete cleanJson.userToken;
        cleanR.result_json = cleanJson;
      }
      return cleanR;
    });

    return res.status(200).json({
      success: true,
      results: cleanResults
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch job results" });
  }
}
