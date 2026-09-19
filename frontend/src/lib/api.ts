const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageFor(status: number, detail?: string): string {
  switch (status) {
    case 401:
      return "Your session is invalid or has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "The requested resource was not found.";
    case 500:
      return "The server hit an unexpected error. Please try again.";
    default:
      return detail ?? `Request failed (${status}).`;
  }
}

export async function apiFetch<T>(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Could not reach the server.");
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, messageFor(response.status, detail));
  }

  return (await response.json()) as T;
}
