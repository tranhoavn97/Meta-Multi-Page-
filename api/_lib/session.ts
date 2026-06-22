import { parseCookies, setCookie, clearCookie } from "./cookies";

export function getMetaAccessToken(req: any): string | null {
  // 1. Secure cookie check
  const cookies = parseCookies(req.headers?.cookie);
  if (cookies.fb_user_token) {
    return cookies.fb_user_token;
  }

  // 2. Authorization Bearer check
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 3. Request temporary forwarding token check (query parameter)
  const queryToken = req.query?.user_token || req.query?.userToken || req.query?.accessToken;
  if (queryToken && typeof queryToken === "string") {
    return queryToken;
  }

  // 4. Request temporary forwarding token check (body parameter)
  const bodyToken = req.body?.user_token || req.body?.userToken || req.body?.accessToken;
  if (bodyToken && typeof bodyToken === "string") {
    return bodyToken;
  }

  // 5. Fallback as last resort
  if (process.env.META_ACCESS_TOKEN) {
    return process.env.META_ACCESS_TOKEN;
  }

  return null;
}

export function setMetaAccessToken(res: any, token: string) {
  setCookie(res, "fb_user_token", token, 60 * 60 * 24 * 30);
}

export function clearMetaAccessToken(res: any) {
  clearCookie(res, "fb_user_token");
}
