export async function safeFetchJson(url: string, options: any = {}): Promise<any> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!response.ok) {
    let errorObj = null;
    try {
      if (contentType.includes("application/json")) {
        errorObj = JSON.parse(text);
      }
    } catch (e) {
      // ignore
    }
    
    const err = new Error(`API Error ${response.status}: ${text.slice(0, 500)}`) as any;
    if (errorObj) {
      err.responseJson = errorObj;
      if (errorObj.error) {
        err.message = typeof errorObj.error === 'string' ? errorObj.error : errorObj.error.message || err.message;
      }
    }
    throw err;
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Response is not JSON: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text);
}
