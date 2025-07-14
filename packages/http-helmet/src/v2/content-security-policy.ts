import { isQuoted } from "#src/utils.ts";
import parseContentSecurityPolicy from "content-security-policy-parser";
import { objectEntries } from "ts-extras";
import {
  reservedCSPKeywords,
  type ContentSecurityPolicyKebab,
  type CspSetting,
} from "../rules/content-security-policy";

type CspValueForKey<T extends string> = T extends "upgrade-insecure-requests"
  ? boolean
  : CspSetting;

type CspDirective = keyof ContentSecurityPolicyKebab;

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
