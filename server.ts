import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Generate Facebook OAuth URL
app.get("/api/auth/url", (req, res) => {
  try {
    const customAppId = req.query.app_id as string;
    const customAppSecret = req.query.app_secret as string;
    
    const appId = customAppId || process.env.META_APP_ID;
    const appSecret = customAppSecret || process.env.META_APP_SECRET;

    if (!appId) {
      return res.status(400).json({ error: "Chưa cấu hình Meta App ID. Vui lòng nhập App ID hoặc cấu hình biến môi trường." });
    }

    // Construct the redirect URI using APP_URL or request headers
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${appUrl}/auth/callback`;

    // Package appId, appSecret, and redirectUri inside the "state" variable (base64 encoded) so that the callback can use it statelessly.
    const stateObj = {
      appId,
      appSecret: appSecret || "",
      redirectUri
    };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString("base64");

    const scopes = "pages_show_list,pages_manage_posts,pages_read_engagement";
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${stateStr}&response_type=code`;

    return res.json({ url: authUrl });
  } catch (error: any) {
    console.error("Lỗi khi tạo Auth URL:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi tạo URL đăng nhập: " + error.message });
  }
});

// Callback: Handle OAuth Authorization Code exchange
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.send(`
      <html>
        <head>
          <title>Facebook Auth Failed</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fafafa; }
            .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
            h1 { color: #e11d48; margin-top: 0; }
            button { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Đăng nhập thất bại</h1>
            <p>${error_description || error}</p>
            <button onclick="window.close()">Đóng cửa sổ này</button>
          </div>
        </body>
      </html>
    `);
  }

  try {
    if (!code) {
      return res.status(400).send("Không nhận được mã xác thực (Authorization code).");
    }

    let appId = process.env.META_APP_ID;
    let appSecret = process.env.META_APP_SECRET;
    let redirectUri = "";

    // Parse state if present
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8"));
        appId = decodedState.appId || appId;
        appSecret = decodedState.appSecret || appSecret;
        redirectUri = decodedState.redirectUri || redirectUri;
      } catch (err) {
        console.error("Lỗi giải mã state:", err);
      }
    }

    if (!redirectUri) {
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      redirectUri = `${appUrl}/auth/callback`;
    }

    if (!appId || !appSecret) {
      return res.status(400).send("Thiếu App ID hoặc App Secret để hoàn tất phiên đăng nhập qua OAuth.");
    }

    // Exchange auth code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData: any = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message || "Không thể lấy access token từ Meta.");
    }

    const userAccessToken = tokenData.access_token;

    // Send the success response back and close the popup window using postMessage
    return res.send(`
      <html>
        <head>
          <title>Facebook Auth Success</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 60px; background: #f0fdf4; color: #166534; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 480px; margin: 0 auto; border: 1px solid #bbf7d0; }
            h1 { color: #15803d; margin-top: 0; font-size: 24px; }
            .spinner { width: 40px; height: 40px; border: 4px solid #bbf7d0; border-top-color: #15803d; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Đăng nhập Facebook thành công!</h1>
            <p>Đang chuyển thông tin xác thực về ứng dụng chính...</p>
            <p style="font-size: 13px; color: #86efac; margin-top: 20px;">Cửa sổ này sẽ tự động đóng ngay lập tức.</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  token: '${userAccessToken}' 
                }, '*');
                setTimeout(() => { window.close(); }, 500);
              } else {
                window.location.href = '/?token=${userAccessToken}';
              }
            } catch (e) {
              console.error(e);
              document.write('<p style="color:red">Lỗi gửi tin nhắn cho cửa sổ mẹ, vui lòng sao chép token thủ công hoặc tải lại trang.</p>');
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Lỗi trong quá trình callback OAuth:", error);
    return res.status(500).send(`
      <html>
        <head>
          <title>Facebook Auth Error</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #fff5f5; color: #991b1b; }
            .card { background: white; padding: 35px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; border: 1px solid #fecaca; }
            h1 { color: #c2410c; margin-top: 0; }
            pre { background: #f8fafc; padding: 12px; border-radius: 6px; text-align: left; font-size: 12px; overflow-x: auto; color: #334155; border: 1px solid #e2e8f0; }
            button { background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Lỗi Đăng Nhập</h1>
            <p>Đã xảy ra lỗi khi trao đổi token với Facebook:</p>
            <pre>${error.message || error}</pre>
            <button onclick="window.close()">Đóng cửa sổ này</button>
          </div>
        </body>
      </html>
    `);
  }
});

// Proxy: Lấy danh sách Fanpage quản lý
app.get("/api/facebook/pages", async (req, res) => {
  const userToken = req.query.user_token as string;
  if (!userToken) {
    return res.status(400).json({ error: "Thiếu user_token truy cập Facebook." });
  }

  try {
    let url = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,picture{url}&access_token=${userToken}&limit=100`;
    let allPages: any[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      const data: any = await response.json();

      if (data.error) {
        if (allPages.length === 0) {
          return res.status(400).json({ error: data.error.message });
        } else {
          break;
        }
      }

      const pagesBatch = data.data || [];
      allPages = allPages.concat(pagesBatch);

      if (pagesBatch.length === 0) {
        break;
      }

      nextUrl = data.paging?.next || null;
    }

    return res.json({ data: allPages });
  } catch (err: any) {
    console.error("Lỗi khi lấy danh sách trang:", err);
    return res.status(500).json({ error: "Lỗi kết nối Graph API: " + err.message });
  }
});

// Proxy: Lấy danh sách bài viết trên trang
app.get("/api/facebook/posts", async (req, res) => {
  const { page_id, page_token, limit } = req.query;
  if (!page_id || !page_token) {
    return res.status(400).json({ error: "Thiếu page_id hoặc page_token truy cập Fanpage." });
  }

  try {
    const requestedLimit = parseInt(limit as string, 10) || 100;
    const initialLimit = Math.min(requestedLimit, 100);
    
    let url = `https://graph.facebook.com/v19.0/${page_id}/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media,type,url},likes.summary(true).limit(0),comments.summary(true).limit(0),shares&access_token=${page_token}&limit=${initialLimit}`;
    
    let allPosts: any[] = [];
    let nextUrl: string | null = url;
    
    while (nextUrl && allPosts.length < requestedLimit) {
      const response = await fetch(nextUrl);
      const data: any = await response.json();
      
      if (data.error) {
        if (allPosts.length === 0) {
          return res.status(400).json({ error: data.error.message });
        } else {
          break;
        }
      }
      
      const postsBatch = data.data || [];
      allPosts = allPosts.concat(postsBatch);
      
      if (postsBatch.length === 0 || allPosts.length >= requestedLimit) {
        break;
      }
      
      nextUrl = data.paging?.next || null;
    }
    
    const finalPosts = allPosts.slice(0, requestedLimit);
    return res.json({ data: finalPosts });
  } catch (err: any) {
    console.error("Lỗi khi lấy danh sách bài viết:", err);
    return res.status(500).json({ error: "Lỗi kết nối Graph API lấy bài viết: " + err.message });
  }
});

// Proxy: Xoá bài viết Fanpage
app.post("/api/facebook/delete-post", async (req, res) => {
  const { post_id, page_token, confirm } = req.body;

  if (!post_id || !page_token) {
    return res.status(400).json({ error: "Thiếu post_id hoặc page_token của Fanpage." });
  }

  if (confirm !== true) {
    return res.status(400).json({ error: "Yêu cầu xóa không hợp lệ. Phải xác nhận xóa bằng tham số confirm=true." });
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${post_id}?access_token=${page_token}`;
    const response = await fetch(url, {
      method: "DELETE"
    });
    const data: any = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    return res.json({ success: true, response: data });
  } catch (err: any) {
    console.error(`Lỗi khi xóa bài viết ${post_id}:`, err);
    return res.status(500).json({ error: "Lỗi khi gửi yêu cầu xóa bài viết: " + err.message });
  }
});

// Vite middleware configuration for development vs static build for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Lỗi khi khởi động server:", err);
});
