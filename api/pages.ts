async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(text);
      if (!response.ok && !data.error) {
         data.error = { message: `API Error ${response.status}: ${text.slice(0, 500)}` };
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

  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || (req.query.user_token || req.query.userToken) as string;
  if (!META_ACCESS_TOKEN) {
    return res.status(400).json({ error: "Missing META_ACCESS_TOKEN" });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture.type(large),access_token,category,tasks&access_token=${META_ACCESS_TOKEN}&limit=100`;
    let allPages: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const data = await backendFetchJson(nextUrl);

      if (data.error) {
        if (allPages.length === 0) {
          return res.status(500).json({ error: data.error.message || "Meta API Error" });
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
    }

    // Call fallback picture API concurrently for pages missing an avatar
    const fallbackPromises = allPages.map(async (page: any) => {
      if (page.picture?.data?.url) {
        return;
      }
      try {
        const pageToken = page.access_token || META_ACCESS_TOKEN;
        const picUrl = `https://graph.facebook.com/v19.0/${page.id}/picture?type=large&redirect=false&access_token=${pageToken}`;
        const picData = await backendFetchJson(picUrl);
        if (picData?.data?.url) {
          page.picture = {
            data: {
              url: picData.data.url
            }
          };
        }
      } catch (err: any) {
        console.error(`Lỗi khi lấy avatar cho page ${page.id}:`, err.message || err);
      }
    });

    await Promise.all(fallbackPromises);

    return res.status(200).json({ data: allPages });
  } catch (error: any) {
    console.error("Lỗi khi tải danh sách Fanpages:", error);
    return res.status(500).json({ error: error.message || "Lỗi máy chủ khi lấy trang" });
  }
}
