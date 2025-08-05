import { ContentSecurityPolicy, StrictTransportSecurity } from ".";
import type { CreateSecureHeaders } from "../helmet";
import type { ContentSecurityPolicyKebab } from "../rules/content-security-policy";
import type { StrictTransportSecurityOptions } from "./strict-transport-security";

export class SecurityHeaders {
  static ContentSecurityPolicy = "Content-Security-Policy";
  static StrictTransportSecurity = "Strict-Transport-Security";
  static XContentTypeOptions = "X-Content-Type-Options";
  static XFrameOptions = "X-Frame-Options";
  static XSSProtection = "X-XSS-Protection";
  static ReferrerPolicy = "Referrer-Policy";
  static PermissionsPolicy = "Permissions-Policy";
  static FeaturePolicy = "Feature-Policy";
  static CrossOriginEmbedderPolicy = "Cross-Origin-Embedder-Policy";
  static CrossOriginOpenerPolicy = "Cross-Origin-Opener-Policy";
  static CrossOriginResourcePolicy = "Cross-Origin-Resource-Policy";

  constructor(input: CreateSecureHeaders = {}) {
    if (input["Content-Security-Policy"]) {
      this.csp = new ContentSecurityPolicy(input["Content-Security-Policy"]);
    }
  }

  csp: ContentSecurityPolicy = new ContentSecurityPolicy();
  sts: StrictTransportSecurity | undefined;

  contentSecurityPolicy(options: ContentSecurityPolicyKebab | undefined): this {
    if (options) this.csp = new ContentSecurityPolicy(options);
    return this;
  }

  strictTransportSecurity(options: StrictTransportSecurityOptions): this {
    if (options) this.sts = new StrictTransportSecurity(options);
    return this;
  }

  public toHeaders(): Headers {
    const headers = new Headers();

    if (this.csp.size() > 0) {
      headers.set(SecurityHeaders.ContentSecurityPolicy, this.csp.toString());
    }

    return headers;
  }
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest;

  it("should create a SecurityHeaders instance", () => {
    const headers = new SecurityHeaders();
    expect(headers).toBeInstanceOf(SecurityHeaders);
  });

  it("should set Content-Security-Policy", () => {
    const headers = new SecurityHeaders();
    headers.contentSecurityPolicy({
      "default-src": ["'self'"],
      "script-src": ["https://example.com"],
    });

    let result = headers.toHeaders();
    expect(result.get(SecurityHeaders.ContentSecurityPolicy)).toBe(
      "default-src 'self'; script-src https://example.com",
    );
  });

  it("should handle empty Content-Security-Policy", () => {
    const headers = new SecurityHeaders();
    headers.contentSecurityPolicy(undefined);
    let result = headers.toHeaders();
    expect(result.get(SecurityHeaders.ContentSecurityPolicy)).toBeNull();
  });

  it("all headers should be available as static properties", () => {
    expect(SecurityHeaders.ContentSecurityPolicy).toBe(
      "Content-Security-Policy",
    );
    expect(SecurityHeaders.StrictTransportSecurity).toBe(
      "Strict-Transport-Security",
    );
    expect(SecurityHeaders.XContentTypeOptions).toBe("X-Content-Type-Options");
    expect(SecurityHeaders.XFrameOptions).toBe("X-Frame-Options");
    expect(SecurityHeaders.XSSProtection).toBe("X-XSS-Protection");
    expect(SecurityHeaders.ReferrerPolicy).toBe("Referrer-Policy");
    expect(SecurityHeaders.PermissionsPolicy).toBe("Permissions-Policy");
    expect(SecurityHeaders.FeaturePolicy).toBe("Feature-Policy");
    expect(SecurityHeaders.CrossOriginEmbedderPolicy).toBe(
      "Cross-Origin-Embedder-Policy",
    );
    expect(SecurityHeaders.CrossOriginOpenerPolicy).toBe(
      "Cross-Origin-Opener-Policy",
    );
    expect(SecurityHeaders.CrossOriginResourcePolicy).toBe(
      "Cross-Origin-Resource-Policy",
    );
  });
}
