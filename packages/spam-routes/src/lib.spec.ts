import * as matchers from "@mcansh/vitest-response-matchers/matchers";
import { expect, it } from "vitest";
import { defaultMatchResponse, throwIfSpamRoute } from "./lib";

expect.extend(matchers);

it("does not throw for unmatched routes", () => {
  expect(() => {
    throwIfSpamRoute(new Request("https://example.com/"));
  }).not.toThrow();

  expect(() => {
    throwIfSpamRoute(new Request("https://example.com/some/real-route"));
  }).not.toThrow();
});

it.each([
  "https://example.com/ads.txt",
  "https://example.com/wp-content/themes/index.php",
])("throws a 404 Response when theres a match %s", (url) => {
  expect(() => {
    throwIfSpamRoute(new Request(url));
  }).toThrowResponse({ status: 404, statusText: "Not Found" });
});

it("throws a custom Response when theres a match", async () => {
  function onMatch(pathname: string) {
    return new Response(`${pathname} is spam`, {
      status: 403,
      statusText: "Forbidden",
    });
  }

  expect(() => {
    throwIfSpamRoute(
      new Request("https://example.com/wp-content/themes/index.php"),
      { onMatch },
    );
  }).toThrowResponse({ status: 403, statusText: "Forbidden" });
});

it("throws a 404 Response when theres a match when using a custom list", () => {
  expect(() => {
    throwIfSpamRoute(new Request("https://example.com/something/custom"), {
      spamRoutes: ["(.*)/custom"],
    });
  }).toThrowResponse(defaultMatchResponse());
});
