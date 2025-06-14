# @mcansh/url

## 0.3.0

### Minor Changes

- 7e1a5fb: add UrlBuilder

  ```ts
  const builder = new UrlBuilder();
  builder.protocol("https").domain("example.com").path("/test").build();

  // => https://example.com/test
  ```

### Patch Changes

- c79afa8: bump dependencies to latest versions
- 3826f9d: add license to both packages during build
