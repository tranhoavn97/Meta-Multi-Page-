import { readDb } from "../db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  try {
    const db = readDb();
    const allResults = db.job_results.filter(r => r.item_type === "check_api_access");

    // Group and find the latest result for each pageId
    const latestMap: Record<string, any> = {};
    for (const r of allResults) {
      const existing = latestMap[r.page_id];
      if (!existing || new Date(r.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
        latestMap[r.page_id] = r;
      }
    }

    const results = Object.values(latestMap).map((r: any) => {
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
      data: results
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch latest API access results" });
  }
}
