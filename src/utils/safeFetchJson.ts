export async function safeFetchJson(url: string, options: any = {}): Promise<any> {
  // Always include credentials to securely transport secure cookies in cross-origin iframe contexts
  const mergedOptions = {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, mergedOptions);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  let hasJson = contentType.includes("application/json");
  let parsed: any = null;

  if (hasJson) {
    try {
      parsed = JSON.parse(text);
    } catch {
      hasJson = false;
    }
  }

  if (!response.ok) {
    let message = `Yêu cầu dịch vụ thất bại (Mã lỗi ${response.status})`;
    let code = "API_ERROR";
    let metaCode: number | undefined;
    let retryable = false;
    let reconnectRequired = false;

    if (parsed) {
      if (parsed.error && typeof parsed.error === "object") {
        message = parsed.error.message || message;
        code = parsed.error.code || code;
        metaCode = parsed.error.metaCode;
        retryable = !!parsed.error.retryable;
        reconnectRequired = !!parsed.error.reconnectRequired;
      } else if (typeof parsed.error === "string") {
        message = parsed.error;
      } else if (parsed.message) {
        message = parsed.message;
      }
    } else if (text) {
      message = text.length > 300 ? text.slice(0, 300) + "..." : text;
    }

    const err = new Error(message) as any;
    err.status = response.status;
    err.code = code;
    err.metaCode = metaCode;
    err.retryable = retryable;
    err.reconnectRequired = reconnectRequired || response.status === 401 || code === "TOKEN_EXPIRED";
    err.responseJson = parsed;

    throw err;
  }

  if (!hasJson) {
    throw new Error(`Đầu ra nhận được không phải là JSON: ${text.slice(0, 200)}`);
  }

  // Gracefully bubble internal API failure indicators
  if (parsed && parsed.success === false && parsed.error) {
    const errorData = parsed.error;
    const err = new Error(errorData.message || "Thực thi thất bại") as any;
    err.status = 200;
    err.code = errorData.code || "API_ERROR";
    err.metaCode = errorData.metaCode;
    err.retryable = !!errorData.retryable;
    err.reconnectRequired = !!errorData.reconnectRequired || err.code === "TOKEN_EXPIRED";
    err.responseJson = parsed;
    throw err;
  }

  return parsed;
}
