export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fields?: Record<string, string> };

/** JSON fetch helper for client components. Never throws. */
export async function api<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: typeof data?.error === "string" ? data.error : "حدث خطأ غير متوقع. حاول مرة أخرى.",
        fields: data?.fields,
      };
    }
    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      status: 0,
      error: "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجدداً.",
    };
  }
}
