import { readDb } from "./db.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const pageId = (req.query.pageId || req.query.page_id) as string;
  if (!pageId) {
    return res.status(400).json({ error: "Thiếu pageId hoặc page_id truy cập Fanpage" });
  }

  try {
    const db = readDb();
    
    // Read from database cache to optimize speed
    const pagePosts = db.cached_posts
      .filter(p => p.pageId === pageId)
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());

    const mapped = pagePosts.map(p => ({
      id: p.id,
      message: p.message || "",
      created_time: p.created_time,
      permalink_url: p.permalink_url || "",
      full_picture: p.full_picture || "",
      status_type: p.status_type || "",
      likes: p.likes || 0,
      comments: p.comments || 0,
      shares: p.shares || 0,
      delete_status: p.delete_status
    }));

    return res.status(200).json({ data: mapped });
  } catch (error: any) {
    console.error(`Lỗi khi lấy danh sách bài viết cho page ${pageId}:`, error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy danh sách bài viết" });
  }
}
