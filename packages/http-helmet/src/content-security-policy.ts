import parseContentSecurityPolicy from "content-security-policy-parser";
import { objectEntries } from "ts-extras";
import type { LiteralUnion } from "type-fest";

import { isQuoted, type QuotedSource } from "#src/utils.ts";

export type CspSetting = Array<LiteralUnion<QuotedSource, string> | undefined>;

type CspValueForKey<T extends string> = T extends "upgrade-insecure-requests"
  ? boolean
  : CspSetting;

export type ContentSecurityPolicyKebab = {
  "child-src"?: CspSetting;
  "connect-src"?: CspSetting;
  "default-src"?: CspSetting;
  "font-src"?: CspSetting;
  "frame-src"?: CspSetting;
  "img-src"?: CspSetting;
  "manifest-src"?: CspSetting;
  "media-src"?: CspSetting;
  "object-src"?: CspSetting;
  "prefetch-src"?: CspSetting;
  "script-src"?: CspSetting;
  "script-src-elem"?: CspSetting;
  "script-src-attr"?: CspSetting;
  "style-src"?: CspSetting;
  "style-src-elem"?: CspSetting;
  "style-src-attr"?: CspSetting;
  "worker-src"?: CspSetting;
  "base-uri"?: CspSetting;
  sandbox?: CspSetting;
  "form-action"?: CspSetting;
  "frame-ancestors"?: CspSetting;
  "navigate-to"?: CspSetting;
  "report-uri"?: CspSetting;
  "report-to"?: CspSetting;
  "require-sri-for"?: CspSetting;
  "require-trusted-types-for"?: CspSetting;
  "trusted-types"?: CspSetting;
  "upgrade-insecure-requests"?: boolean;
};

type CspDirective = keyof ContentSecurityPolicyKebab;

export let reservedCSPKeywords = new Set([
  "self",
  "none",
  "unsafe-inline",
  "unsafe-eval",
]);

export class ContentSecurityPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentSecurityPolicyError";
  }
}

export class ContentSecurityPolicy {
  #policy = new Map<CspDirective, CspValueForKey<CspDirective>>();

  constructor(input: string | ContentSecurityPolicyKebab = "") {
    if (typeof input === "string") {
      this.parse(input);
    } else {
      for (let [key, values] of objectEntries(input)) {
        if (key === "upgrade-insecure-requests") {
          this.#policy.set("upgrade-insecure-requests", []);
          continue;
        }

        if (typeof values === "boolean") {
          continue;
        }

        let definedValues = this.#getDefinedValues(values);

        for (let value of definedValues) {
          if (reservedCSPKeywords.has(value) && !isQuoted(value)) {
            throw new ContentSecurityPolicyError(
              `reserved keyword ${value} must be quoted.`,
            );
          }
        }

        if (definedValues.length > 0) {
          this.#policy.set(key, definedValues);
        }
      }
    }
  }

  #getDefinedValues(values: CspValueForKey<CspDirective>) {
    return Array.isArray(values)
      ? values.filter((v): v is string => v !== undefined)
      : [];
  }

  public toString(): string {
    return Array.from(this.#policy.entries())
      .map(([key, values]) => {
        if (key === "upgrade-insecure-requests") {
          return "upgrade-insecure-requests";
        }

        if (typeof values === "boolean") return;

        return `${key} ${values.join(" ")}`;
      })
      .join("; ");
  }

  size(): number {
    return this.#policy.size || 0;
  }

  upgradeInsecureRequests() {
    this.#policy.set("upgrade-insecure-requests", []);
    return this;
  }

  parse(input: string): this {
    let parsed = parseContentSecurityPolicy(input);

    for (let [key, values] of parsed.entries()) {
      if (key === "upgrade-insecure-requests") {
        this.#policy.set("upgrade-insecure-requests", []);
        continue;
      }

      this.#policy.set(key as CspDirective, values);
    }

    return this;
  }

  set(key: CspDirective, values: CspValueForKey<CspDirective>): this {
    let definedValues = this.#getDefinedValues(values);
    this.#policy.set(key, definedValues);
    return this;
  }

  append(key: CspDirective, values: CspValueForKey<CspDirective>): this {
    let existing = this.#policy.get(key) || [];

    if (typeof existing === "boolean" || typeof values === "boolean") {
      throw new ContentSecurityPolicyError(
        `Cannot append to boolean directive: ${key}`,
      );
    }

    let definedValues = this.#getDefinedValues(values);

    this.#policy.set(key, [...existing, ...definedValues]);

    return this;
  }

  get(key: CspDirective): CspValueForKey<CspDirective> | undefined {
    return this.#policy.get(key);
  }
}
