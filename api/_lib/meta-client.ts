import { sanitizeSensitiveText } from "./sanitize";
import { mapMetaErrorToHttpStatus, MetaApiError } from "./meta-errors";

export interface MetaRateLimitInfo {
  appUsage: string | null;
  pageUsage: string | null;
  businessUsage: string | null;
}

export interface MetaFetchResult<T = any> {
  data: T;
  rateLimitInfo: MetaRateLimitInfo;
}

export function getSingleQueryParam(value: any): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return first !== undefined && first !== null ? String(first) : undefined;
  }
  return value !== undefined && value !== null ? String(value) : undefined;
}

/**
 * Unified fetch helper for interacting with the Meta Graph API.
 * Sanitizes logging, parses response body securely, and extracts rate limiting headers.
 */
export async function metaFetchJson<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<MetaFetchResult<T>> {
  const sanitizedUrl = sanitizeSensitiveText(url);
  console.log(`[Meta API Request] Method: ${options.method || "GET"} | URL: ${sanitizedUrl}`);

  const response = await fetch(url, options);

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  const rateLimitInfo: MetaRateLimitInfo = {
    appUsage: response.headers.get("x-app-usage"),
    pageUsage: response.headers.get("x-page-usage"),
    businessUsage: response.headers.get("x-business-use-case-usage"),
  };

  let parsed: any = null;
  let isJson = false;

  if (contentType.includes("application/json")) {
    try {
      parsed = JSON.parse(text);
      isJson = true;
    } catch (e) {
      console.error("[Meta API Client] Could not parse application/json payload.");
    }
  }

  // Handle Meta errors defined in the body, or HTTP error codes
  if (!response.ok || (parsed && parsed.error)) {
    const rawError = parsed?.error || {
      message: isJson ? (parsed?.message || "Error") : text || `HTTP status ${response.status}`,
      code: response.status,
      type: "HTTP_STATUS_ERROR"
    };

    const parsedError = mapMetaErrorToHttpStatus(rawError);
    
    console.error(
      `[Meta API Error Response] HTTP ${parsedError.status} (${parsedError.code}): ${sanitizeSensitiveText(parsedError.message)}`
    );

    throw {
      ...parsedError,
      rateLimitInfo
    };
  }

  if (!isJson) {
    throw {
      status: 502,
      code: "BAD_GATEWAY",
      message: "Graph API returned an invalid non-JSON frame.",
      retryable: true,
      rateLimitInfo
    };
  }

  return {
    data: parsed,
    rateLimitInfo
  };
}

/**
 * Parses Meta's performance/rate limit headers into an integer percentage.
 * Handles simple counts as well as complex JSON objects.
 */
export function parseUsagePercentage(usageHeader: string | null): number {
  if (!usageHeader) return 0;
  const cleaned = usageHeader.trim();
  if (!cleaned) return 0;

  if (cleaned.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleaned);
      let maxVal = 0;
      for (const val of Object.values(parsed)) {
        if (typeof val === "number") {
          maxVal = Math.max(maxVal, val);
        } else if (typeof val === "string") {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            maxVal = Math.max(maxVal, num);
          }
        }
      }
      return maxVal;
    } catch {
      // Flow falls back to regex parser
    }
  }

  const matches = cleaned.match(/\d+/g);
  if (matches && matches.length > 0) {
    const values = matches.map(Number);
    return Math.max(...values);
  }

  const num = parseInt(cleaned.replace("%", ""), 10);
  return isNaN(num) ? 0 : num;
}
