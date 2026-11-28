type ApiResult = Record<string, unknown>;

function apiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:4000";
  return "";
}

export async function postPublicApi(path: string, payload: Record<string, unknown>, requestKey: string) {
  const origin = apiOrigin();
  if (!origin) throw new Error("The booking service is not connected yet. Please try again later.");
  let response: Response;
  try {
    response = await fetch(`${origin}/api/public/${path}`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json", "idempotency-key": requestKey },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("We couldn’t reach the booking service. Your request hasn’t been submitted. Please try again.");
  }
  const result = await response.json().catch(() => ({})) as ApiResult;
  if (!response.ok || result.ok !== true) {
    const message = typeof result.error === "string" ? result.error : "We couldn’t submit your request. Please try again.";
    throw new Error(message);
  }
  return result;
}

export async function getPublicApi(path: string) {
  const origin = apiOrigin();
  if (!origin) throw new Error("The reflections service is not connected yet.");
  const response = await fetch(`${origin}/api/public/${path}`, { credentials: "include", cache: "no-store" });
  const result = await response.json().catch(() => ({})) as ApiResult;
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Request failed.");
  return result;
}

export async function mutatePublicApi(path: string, payload: Record<string, unknown>) {
  const origin = apiOrigin();
  if (!origin) throw new Error("The reflections service is not connected yet.");
  const response = await fetch(`${origin}/api/public/${path}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({})) as ApiResult;
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Request failed.");
  return result;
}

export async function requestBackend<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: Record<string, unknown>; idempotencyKey?: string } = {},
): Promise<T> {
  const origin = apiOrigin();
  if (!origin) throw new Error("The backend service is not connected yet.");
  const headers: Record<string, string> = {};
  if (options.body) headers["content-type"] = "application/json";
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;
  let response: Response;
  try {
    response = await fetch(`${origin}${path}`, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      credentials: "include",
      cache: "no-store",
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error("We couldn’t reach the backend. Check the service connection and try again.");
  }
  const result = response.status === 204 ? {} : await response.json().catch(() => ({})) as T;
  if (!response.ok) {
    const error = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error
      : "The request couldn’t be completed.";
    throw new Error(error);
  }
  return result as T;
}

export async function downloadLeadExport() {
  const origin = apiOrigin();
  if (!origin) throw new Error("The backend service is not connected yet.");
  let response: Response;
  try {
    response = await fetch(`${origin}/api/admin/leads/export.csv`, {
      credentials: "include", cache: "no-store",
    });
  } catch {
    throw new Error("We couldn’t reach the backend. The export was not downloaded.");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as ApiResult;
    throw new Error(typeof result.error === "string" ? result.error : "The lead export could not be downloaded.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `mindsupport-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function createRequestKey() {
  return crypto.randomUUID();
}
