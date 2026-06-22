export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const parts = c.trim().split("=");
      const key = parts[0]?.trim() || "";
      const val = parts.slice(1).join("=");
      return [key, decodeURIComponent(val)];
    })
  );
}

export function setCookie(
  res: any,
  name: string,
  value: string,
  maxAgeSeconds: number = 60 * 60 * 24 * 30
) {
  const cookieOptions = [
    `${name}=${encodeURIComponent(value)}`,
    `HttpOnly`,
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    `SameSite=None`,
    `Secure`
  ].join("; ");

  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", cookieOptions);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, cookieOptions]);
  } else {
    res.setHeader("Set-Cookie", [existing, cookieOptions]);
  }
}

export function clearCookie(res: any, name: string) {
  setCookie(res, name, "", 0);
}
