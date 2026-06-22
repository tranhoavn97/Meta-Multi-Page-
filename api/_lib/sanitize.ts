export function sanitizeSensitiveText(text: string): string {
  if (!text) return "";
  let sanitized = text;

  // Mask access_token in query or json format
  sanitized = sanitized.replace(/(access_token[=:]\s*["']?)[a-zA-Z0-9_\-\.\:\+]+/gi, "$1[HIDDEN]");
  
  // Mask client_secret in query or json format
  sanitized = sanitized.replace(/(client_secret[=:]\s*["']?)[a-zA-Z0-9_\-\.\:\+]+/gi, "$1[HIDDEN]");
  
  // Mask META_APP_SECRET if defined
  if (process.env.META_APP_SECRET) {
    const escapedSecret = process.env.META_APP_SECRET.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    sanitized = sanitized.replace(new RegExp(escapedSecret, "g"), "[HIDDEN_APP_SECRET_ENV]");
  }

  // Mask Meta access tokens starting with EAA
  sanitized = sanitized.replace(/\b(EAA[a-zA-Z0-9_\-\.\+]{15,})\b/g, "[HIDDEN_TOKEN]");

  // Mask Authorization header Bearer token
  sanitized = sanitized.replace(/(Bearer\s+)[a-zA-Z0-9_\-\.\+]+/gi, "$1[HIDDEN]");

  // Mask Cookie headers
  sanitized = sanitized.replace(/(Cookie:\s+)[^\r\n]+/gi, "$1[HIDDEN]");

  return sanitized;
}
