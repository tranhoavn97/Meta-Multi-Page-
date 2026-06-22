import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { parseCookies, clearCookie } from "../_lib/cookies";
import { setMetaAccessToken } from "../_lib/session";
import { GRAPH_API_VERSION, GRAPH_API_BASE, checkRequiredEnvVars } from "../_lib/meta-config";
import { metaFetchJson } from "../_lib/meta-client";
import { sanitizeSensitiveText } from "../_lib/sanitize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  try {
    const envCheck = checkRequiredEnvVars();
    if (!envCheck.valid) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: {
          code: "MISSING_SERVER_CONFIG",
          message: "Máy chủ đang thiếu cấu hình cần thiết."
        }
      });
    }

    const { code, state, error, error_description } = req.query;

    if (error) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        success: false,
        error: {
          code: "OAUTH_ERROR",
          message: String(error_description || error)
        }
      });
    }

    // 1. Read states
    const queryState = typeof state === "string" ? state : "";
    const cookies = parseCookies(req.headers?.cookie);
    const cookieState = cookies.oauth_state || "";

    // Clear state cookie immediately after read
    clearCookie(res, "oauth_state");

    if (!queryState || !cookieState || queryState !== cookieState) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE",
          message: "OAuth state không hợp lệ hoặc đã hết hạn."
        }
      });
    }

    if (!code || typeof code !== "string") {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CODE",
          message: "Không nhận được mã xác thực (Authorization code)."
        }
      });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: {
          code: "MISSING_APP_SECRET",
          message: "META_APP_SECRET chưa được cấu hình trên máy chủ."
        }
      });
    }
    if (!appId) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_APP_ID",
          message: "Chưa cấu hình Meta App ID."
        }
      });
    }

    const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
    const redirectUri = `${appUrl}/auth/callback`;

    // 2. Exchange authorization code for User Access Token
    const tokenUrl = `${GRAPH_API_BASE}/oauth/access_token` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&code=${encodeURIComponent(code)}`;

    // Use unified fetch client (handles error mapping and returns standardized outcome)
    const result = await metaFetchJson(tokenUrl);
    const userAccessToken = result.data.access_token;

    if (!userAccessToken) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        success: false,
        error: {
          code: "MISSING_ACCESS_TOKEN",
          message: "Không thể lấy access token từ Meta."
        }
      });
    }

    // 3. Save User Access Token into Secure, HTTP-Only session cookie
    setMetaAccessToken(res, userAccessToken);

    // 4. Return success page that signals the parent window without exposing the token
    const allowedOrigin = process.env.APP_URL || `https://${req.headers.host}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facebook Đăng Nhập Thành Công</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 60px; background: #0b1528; color: #f8fafc; }
            .card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(20px); padding: 40px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.08); max-width: 480px; margin: 0 auto; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
            h1 { color: #22d3ee; margin-top: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; }
            .spinner { width: 40px; height: 40px; border: 3px solid rgba(34, 211, 238, 0.1); border-top-color: #22d3ee; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 24px auto; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="spinner"></div>
            <h1>Đăng nhập Facebook thành công!</h1>
            <p>Đang chuyển thông tin xác thực về ứng dụng chính...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS'
                }, '${allowedOrigin}');
                setTimeout(() => { window.close(); }, 600);
              } else {
                window.location.href = '/?oauth=success';
              }
            } catch (e) {
              console.error("Lỗi callback postMessage:", e);
              window.location.href = '/?oauth=success';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Lỗi trong quá trình callback OAuth:", sanitizeSensitiveText(err.stack || err.message));
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Lỗi máy chủ trong callback OAuth."
      }
    });
  }
}
