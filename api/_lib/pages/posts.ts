import { readDb } from "../db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Missing pageId parameter" });
  }

  try {
    const db = readDb();
    
    // Fetch cached posts for the page, sorting by created_time desc
    const pagePosts = db.cached_posts
      .filter(p => p.pageId === pageId)
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    return res.status(200).json({
      success: true,
      data: pagePosts
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to fetch cached posts" });
  }
}
