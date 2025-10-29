export type StrictTransportSecurityOptions =
  | {
      maxAge: number;
      includeSubDomains?: boolean | undefined;
      preload?: boolean | undefined;
    }
  | true;

export class StrictTransportSecurity {
  #maxAge?: number | undefined;
  #includeSubDomains?: boolean | undefined;
  #preload?: boolean | undefined;

  constructor(options?: StrictTransportSecurityOptions) {
    if (options === true) {
      this.#maxAge = 63072000;
      this.#includeSubDomains = true;
      this.#preload = true;
    } else {
      this.#maxAge = options?.maxAge;
      this.#includeSubDomains = options?.includeSubDomains;
      this.#preload = options?.preload;
    }
  }

  maxAge(maxAge: number) {
    this.#maxAge = maxAge;
  }

  includeSubDomains(option: boolean) {
    this.#includeSubDomains = option;
  }

  preload(option: boolean) {
    this.#preload = option;
  }

  public toString(): string {
    let result = [`max-age=${this.#maxAge}`];
    if (this.#includeSubDomains) result.push("includeSubDomains");
    if (this.#preload) result.push("preload");
    return result.join("; ");
  }
}

if (import.meta.vitest) {
  const { expect, it } = import.meta.vitest;

  it("is an instance of Strict-Transport-Security", () => {
    const sts = new StrictTransportSecurity(true);
    expect(sts).toBeInstanceOf(StrictTransportSecurity);
  });

  it("should create a default Strict-Transport-Security header", () => {
    const sts = new StrictTransportSecurity(true);
    expect(sts.toString()).toBe("max-age=63072000; includeSubDomains; preload");
  });

  it("should create a custom Strict-Transport-Security header", () => {
    const sts = new StrictTransportSecurity({
      maxAge: 31536000,
      includeSubDomains: false,
      preload: true,
    });
    expect(sts.toString()).toBe("max-age=31536000; preload");
  });

  it("should let you update options", () => {
    const sts = new StrictTransportSecurity();
    sts.maxAge(15552000);
    expect(sts.toString()).toBe("max-age=15552000");
    sts.includeSubDomains(true);
    expect(sts.toString()).toBe("max-age=15552000; includeSubDomains");
    sts.preload(true);
    expect(sts.toString()).toBe("max-age=15552000; includeSubDomains; preload");
    sts.maxAge(63072000);
    expect(sts.toString()).toBe("max-age=63072000; includeSubDomains; preload");
  });
}
