import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;

  if (!data) {
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the API. Is the NestJS server running?";
    }
    return fallback;
  }

  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;

  return fallback;
}
