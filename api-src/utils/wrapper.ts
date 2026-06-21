import { Request, Response } from "express";

// Helper function to sanitize sensitive properties from log inputs
export function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item));
  }
  
  const copy = { ...obj };
  const sensitiveKeys = [
    "token", 
    "accessToken", 
    "access_token", 
    "appSecret", 
    "app_secret", 
    "userToken", 
    "user_token", 
    "META_ACCESS_TOKEN", 
    "META_APP_SECRET"
  ];
  
  for (const key of Object.keys(copy)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      copy[key] = "[REDACTED_SENSITIVE_DATA]";
    } else if (typeof copy[key] === "object") {
      copy[key] = sanitize(copy[key]);
    }
  }
  return copy;
}

// Wrapper for all backend handler routes to capture 500 errors and format responses
export function safeHandler(
  handlerName: string, 
  requiredEnvVars: string[], 
  fn: (req: any, res: any) => Promise<any>
) {
  return async (req: Request, res: Response) => {
    // Intercept res.json to automatically shape error responses to the required structure
    const originalJson = res.json;
    res.json = function (body: any) {
      if (body && body.error && body.success === undefined) {
        let code = body.code || "BAD_REQUEST";
        if (res.statusCode === 405) code = "METHOD_NOT_ALLOWED";
        if (res.statusCode === 404) code = "NOT_FOUND";
        if (res.statusCode === 500) code = "INTERNAL_SERVER_ERROR";
        
        body = {
          success: false,
          error: body.error,
          code: code
        };
      }
      return originalJson.call(this, body);
    };

    try {
      // 1. Check all critical environment variables
      const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
      if (missingEnvVars.length > 0) {
        console.error(`[${handlerName}] Error: Missing environment variables: ${missingEnvVars.join(", ")}`);
        return res.status(500).json({
          success: false,
          error: `Hệ thống thiếu biến môi trường cấu hình: ${missingEnvVars.join(", ")}`,
          code: "MISSING_ENV_VARIABLES"
        });
      }

      // 2. Execute the route handler
      await fn(req, res);

      // 3. Prevent hanging connections if handler forgets to return a response
      if (!res.headersSent) {
        console.error(`[${handlerName}] Warning: Handler completed without sending a response.`);
        return res.status(500).json({
          success: false,
          error: "Không nhận được phản hồi hợp lệ từ máy chủ.",
          code: "NO_RESPONSE_SENT"
        });
      }
    } catch (error: any) {
      // 4. Robust sanitized logging of handler crash details
      console.error(`=== ERROR IN HANDLER: ${handlerName} ===`);
      console.error(`Error Message: ${error.message || String(error)}`);
      console.error(`Stack Trace: ${error.stack}`);
      console.error(`HTTP Method: ${req.method}`);
      console.error(`URL Path: ${req.originalUrl || req.url}`);
      console.error(`Cleaned Body:`, JSON.stringify(sanitize(req.body)));
      console.error(`Cleaned Query:`, JSON.stringify(sanitize(req.query)));

      const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
      if (missingEnvVars.length > 0) {
        console.error(`Missing Environment Variables: ${missingEnvVars.join(", ")}`);
      }

      // 5. Deduce specific error codes based on error contents
      let errorCode = "INTERNAL_SERVER_ERROR";
      const errorMsg = error.message || "Lỗi máy chủ nội bộ";

      if (errorMsg.includes("API Error") || errorMsg.includes("Facebook API") || errorMsg.includes("OAuthException") || errorMsg.includes("Meta")) {
        errorCode = "META_API_ERROR";
      } else if (errorMsg.includes("db.json") || errorMsg.includes("Database")) {
        errorCode = "DATABASE_ERROR";
      } else if (errorMsg.includes("timeout") || errorMsg.includes("aborted")) {
        errorCode = "REQUEST_TIMEOUT";
      }

      // 6. Return standard structured JSON error response
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: errorMsg,
          code: errorCode
        });
      }
    }
  };
}

// Wrapper for backend fetch requests to set a query timeout limit and prevent hung tasks
export async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 8000): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error(`Kết nối tới API Meta đã vượt quá giới hạn thời gian (Timeout ${timeoutMs}ms)`);
    }
    throw err;
  }
}
