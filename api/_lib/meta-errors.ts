export interface MetaApiError {
  status: number;
  code: string;
  message: string;
  metaCode?: number;
  metaSubcode?: number;
  retryable: boolean;
  reconnectRequired?: boolean;
}

export function mapMetaErrorToHttpStatus(metaError: {
  code?: number;
  error_subcode?: number;
  type?: string;
  message?: string;
}): MetaApiError {
  const metaCode = metaError.code;
  const metaSubcode = metaError.error_subcode;
  const message = metaError.message || "Unknown Meta Graph API error.";
  const type = metaError.type || "";
  const msgLower = message.toLowerCase();

  let status = 500;
  let code = "META_API_ERROR";
  let retryable = false;
  let reconnectRequired = false;

  // Session / Token Expired
  if (
    metaCode === 190 ||
    msgLower.includes("expired") ||
    msgLower.includes("revoked") ||
    msgLower.includes("invalid access token") ||
    msgLower.includes("session has been invalidated") ||
    msgLower.includes("password has been changed") ||
    (type === "OAuthException" && (msgLower.includes("token") || msgLower.includes("session") || msgLower.includes("auth")))
  ) {
    status = 401;
    code = "TOKEN_EXPIRED";
    reconnectRequired = true;
    retryable = false;
  }
  // Permission / Authorization Denied
  else if (
    metaCode === 10 ||
    metaCode === 200 ||
    metaCode === 210 ||
    metaCode === 283 ||
    msgLower.includes("permission") ||
    msgLower.includes("require") ||
    msgLower.includes("scope") ||
    msgLower.includes("capability") ||
    (type === "OAuthException" && msgLower.includes("permission"))
  ) {
    status = 403;
    code = "PERMISSION_DENIED";
    retryable = false;
  }
  // Rate Limit / Throttling
  else if (
    metaCode === 4 ||
    metaCode === 17 ||
    metaCode === 613 ||
    msgLower.includes("rate limit") ||
    msgLower.includes("too many requests") ||
    msgLower.includes("throttled")
  ) {
    status = 429;
    code = "RATE_LIMIT_EXCEEDED";
    retryable = true;
  }
  // Input arguments / bad requests
  else if (
    metaCode === 100 ||
    metaCode === 120 ||
    msgLower.includes("parameter") ||
    msgLower.includes("invalid page")
  ) {
    status = 400;
    code = "BAD_REQUEST";
    retryable = false;
  }
  // Resource Not Found
  else if (
    metaCode === 803 ||
    metaCode === 2500 ||
    msgLower.includes("does not exist") ||
    msgLower.includes("not found")
  ) {
    status = 404;
    code = "NOT_FOUND";
    retryable = false;
  }

  return {
    status,
    code,
    message,
    metaCode,
    metaSubcode,
    retryable,
    reconnectRequired,
  };
}
