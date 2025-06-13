type QueryParams = Record<string, string | number | boolean | undefined>;

const protocolsWithTrailingSlash = new Set([
  "http",
  "https",
  "ftp",
  "ws",
  "wss",
  "file",
] as const);

type protocolsWithTrailingSlash =
  typeof protocolsWithTrailingSlash extends Set<infer T> ? T : never;

export class UrlBuilder {
  private protocolValue: string = "http";
  private domainValue: string = "";
  private readonly pathSegments: string[] = [];
  private queryParams: QueryParams = {};
  private hashValue: string = "";

  protocol(protocol: string): Omit<this, "protocol"> {
    this.protocolValue = protocol.replace(/:$/, ""); // Remove trailing colon if present
    return this;
  }

  domain(domain: string): Omit<this, "domain"> {
    this.domainValue = domain.replace(/^\/+|\/+$/g, ""); // Trim slashes
    return this;
  }

  path(path: string): Omit<this, "path"> {
    this.pathSegments.push(path.replace(/^\/+|\/+$/g, "")); // Trim slashes
    return this;
  }

  param(key: string, value: string | number | boolean | undefined): this {
    if (value !== undefined) {
      this.queryParams[key] = value;
    }
    return this;
  }

  hash(hash: string): this {
    // Append hash, removing leading hashes
    this.hashValue = this.hashValue + `#${hash.replace(/^#+/, "")}`;
    return this;
  }

  username(username: string): Omit<this, "username"> {
    this.domainValue = `${username}@${this.domainValue}`;
    return this;
  }

  password(password: string): Omit<this, "password"> {
    const [username, domain] = this.domainValue.split("@");
    this.domainValue = `${username}:${password}@${domain}`;
    return this;
  }

  port(port: number): Omit<this, "port"> {
    this.domainValue = `${this.domainValue}:${port}`;
    return this;
  }

  toURL(): URL {
    const urlString = this.build();
    return new URL(urlString);
  }

  get href(): string {
    return this.build();
  }

  build(): string {
    if (!this.domainValue) {
      throw new Error("Domain is required to build the URL.");
    }

    let path =
      this.pathSegments.length > 0 ? `/${this.pathSegments.join("/")}` : "";

    // Handle trailing slash for certain protocols when no path is provided
    if (
      this.pathSegments.length === 0 &&
      protocolsWithTrailingSlash.has(
        this.protocolValue as protocolsWithTrailingSlash,
      )
    ) {
      path += "/";
    }

    const query = Object.keys(this.queryParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(this.queryParams[key]))}`,
      )
      .join("&");
    const queryString = query ? `?${query}` : "";
    const hashString = this.hashValue ? this.hashValue : "";

    return `${this.protocolValue}://${this.domainValue}${path}${queryString}${hashString}`;
  }
}


