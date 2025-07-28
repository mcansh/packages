import type { Key } from "path-to-regexp";
import { pathToRegexp } from "path-to-regexp";
import { SPAM_ROUTES } from "./spam-routes";

export type OnMatch = (pathname: string) => Response;

export let defaultMatchResponse = new Response(null, {
  status: 404,
  statusText: "Not Found",
});

export type SpamRouteOptions = {
  spamRoutes?: Array<string>;
  onMatch?: OnMatch;
};

export function throwIfSpamRoute(request: Request, options?: SpamRouteOptions) {
  options ??= {};
  options.spamRoutes ??= SPAM_ROUTES;
  options.onMatch ??= () => defaultMatchResponse;

  let url = new URL(request.url);

  let keys: Array<Key> = [];
  let regexes = options.spamRoutes.map((regex) => pathToRegexp(regex, keys));

  for (let regex of regexes) {
    if (regex.test(url.pathname)) {
      throw options.onMatch(url.pathname);
    }
  }
}
