---
"@mcansh/url": minor
---

add UrlBuilder

```ts
const builder = new UrlBuilder();
builder
       .protocol("https")
       .domain("example.com")
       .path("/test")
       .build();

// => https://example.com/test
```
