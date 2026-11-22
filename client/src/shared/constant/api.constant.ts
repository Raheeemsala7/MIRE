export const API_URL =
  process.env.API_URL ||
  process.env.BACKEND_API_URL ||
  "https://mire-fqdw.vercel.app/api/v1";

export const HEADERS = {
  JsonBody: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  AcceptLanguage: (locale: string) => ({
    "Accept-Language": `${locale}`,
  }),
  authorize: (token?: unknown) => ({
    Authorization: `Bearer ${token || ""}`,
  }),
};
