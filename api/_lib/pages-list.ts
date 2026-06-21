import { encrypt } from "./db.js";
import { fetchWithTimeout } from "./utils/wrapper.js";

async function fetchAllPages(userToken: string): Promise<any[]> {
  let allPages: any[] = [];
  let url: string | null = `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,tasks,category,picture&access_token=${userToken}&limit=100`;
  
  while (url) {
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || "Lỗi API Meta khi lấy trang");
    }
    if (data.data) {
      allPages = allPages.concat(data.data);
    }
    url = data.paging?.next || null;
  }
  return allPages;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const userToken = (req.query.user_token || req.query.userToken || req.body?.userToken || req.body?.user_token) as string;
  if (!userToken) {
    return res.status(400).json({ error: "Thiếu user_token để lấy danh sách Fanpage" });
  }

  try {
    const pages = await fetchAllPages(userToken);
    
    const mappedPages = pages.map((page: any) => {
      const tasks = page.tasks || [];
      const hasManage = tasks.includes("MANAGE") || tasks.includes("pages_manage_posts") || tasks.includes("pages_read_engagement");
      const hasCreate = tasks.includes("CREATE_CONTENT") || tasks.includes("CREATE") || tasks.includes("pages_manage_posts");
      
      let accessStatus = "Bình thường";
      if (!page.access_token) {
        accessStatus = "Token lỗi";
      } else if (!hasManage || !hasCreate) {
        accessStatus = "Thiếu quyền";
      }
      
      const avatarUrl = page.picture?.data?.url || "";
      
      return {
        id: page.id,
        name: page.name,
        avatar_url: avatarUrl,
        access_status: accessStatus,
        tasks: tasks,
        category: page.category || "",
        access_token_encrypted: page.access_token ? encrypt(page.access_token) : ""
      };
    });

    return res.status(200).json({ data: mappedPages });
  } catch (error: any) {
    console.error("Lỗi khi đồng bộ danh sách Fanpage:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy danh sách Fanpage" });
  }
}
