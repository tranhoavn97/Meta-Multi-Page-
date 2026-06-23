async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  const rateLimitInfo = {
    appUsage: response.headers.get("x-app-usage"),
    pageUsage: response.headers.get("x-page-usage"),
    businessUsage: response.headers.get("x-business-use-case-usage"),
  };

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!response.ok && !data.error) {
         data.error = { message: `API Error ${response.status}: ${text.slice(0, 500)}` };
      }
      if (data && typeof data === "object") {
        data._rateLimitInfo = rateLimitInfo;
      }
      return data;
    } catch (e) {
      // JSON parse failed
    }
  }

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text.slice(0, 500)}`);
  }

  throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
}

export default async function handler(req: any, res: any) {
  // Ensure we set headers to prevent caching issues in serverless functions
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json");

  const META_ACCESS_TOKEN = (req.query.user_token || req.query.userToken || process.env.META_ACCESS_TOKEN) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,picture{url},tasks&access_token=${META_ACCESS_TOKEN}&limit=100`;
    let allPages: any[] = [];
    let nextUrl: string | null = url;

    let lastRateLimitInfo: any = null;
    while (nextUrl) {
      const data = await backendFetchJson(nextUrl);
      if (data && data._rateLimitInfo) {
        lastRateLimitInfo = data._rateLimitInfo;
      }

      if (data.error) {
        if (allPages.length === 0) {
          return res.status(500).json({ 
            error: data.error.message || "Meta API Error",
            errorCode: data.error.code 
          });
        } else {
          break;
        }
      }

      const pagesBatch = data.data || [];
      allPages = allPages.concat(pagesBatch);

      if (pagesBatch.length === 0) {
        break;
      }

      nextUrl = (data.paging && data.paging.next) || null;
      if (nextUrl) {
        const delayMs = Math.floor(Math.random() * 501) + 500; // 500 - 1000 ms
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return res.status(200).json({ 
      data: allPages,
      rateLimitInfo: lastRateLimitInfo || { appUsage: null, pageUsage: null, businessUsage: null }
    });
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách Fanpages:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy trang" });
  }
}
