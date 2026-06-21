import { readDb, writeDb, decrypt } from "../db.js";
import { fetchWithTimeout } from "../utils/wrapper.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Missing pageId parameter" });
  }

  const pageAccessToken = (req.query.pageAccessToken || req.query.page_access_token || req.body?.pageAccessToken) as string;

  try {
    let pageToken = pageAccessToken || "";
    if (pageToken && pageToken.includes(":")) {
      pageToken = decrypt(pageToken);
    }

    let db: any = null;
    let page: any = null;

    if (!pageToken) {
      db = readDb();
      page = db.cached_pages.find((p: any) => p.id === pageId);
      if (page) {
        pageToken = page.access_token_encrypted 
          ? decrypt(page.access_token_encrypted) 
          : "";
      }
    }

    if (!pageToken) {
      return res.status(400).json({ error: "Không có page access token để tải avatar mới" });
    }

    const fbUrl = `https://graph.facebook.com/v23.0/${pageId}/picture?type=large&redirect=false&access_token=${pageToken}`;
    const fbRes = await fetchWithTimeout(fbUrl);
    const fbData = await fbRes.json();

    if (fbData?.data?.url) {
      // Update cache
      if (page && db) {
        page.avatar_url = fbData.data.url;
        page.last_synced_at = new Date().toISOString();
        writeDb(db);
      }

      return res.status(200).json({
        success: true,
        url: fbData.data.url
      });
    } else {
      return res.status(400).json({
        error: fbData.error?.message || "Failed to fetch avatar url from Meta Graph API"
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to refresh avatar" });
  }
}
