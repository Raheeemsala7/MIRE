import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedResult = await requestLocale;
  const locale = hasLocale(routing.locales, requestedResult)
    ? requestedResult
    : routing.defaultLocale;

  return {
    locale,
    timeZone: "Africa/Cairo",
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "Africa/Cairo",
  };
});

