async function backendFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${text.slice(0, 500)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text);
}

export default async function handler(req: any, res: any) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({ error: error_description || error });
  }

  try {
    if (!code) {
      return res.status(400).json({ error: "Không nhận được mã xác thực (Authorization code)." });
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
      const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
      redirectUri = `${appUrl}/auth/callback`;
    }

    if (!appId || !appSecret) {
      return res.status(400).json({ error: "Thiếu App ID hoặc App Secret để hoàn tất phiên đăng nhập qua OAuth." });
    }

    // Exchange auth code for user access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}` +
      `&code=${code}`;

    const tokenData = await backendFetchJson(tokenUrl);

    if (tokenData.error) {
      return res.status(500).json({ error: tokenData.error.message || "Không thể lấy access token từ Meta." });
    }

    const userAccessToken = tokenData.access_token;

    // Send the success response back and close the popup window using postMessage
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
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
    return res.status(500).json({ error: error.message || "Lỗi máy chủ trong callback OAuth." });
  }
}
