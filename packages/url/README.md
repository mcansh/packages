# @mcansh/url

a template string function to create urls and only keeping search params with values - based on [this tweet](https://x.com/Steve8708/status/1792939860820644201)

```ts
let filter = undefined;
let user = null;
let q = "my search";
urlString`https://site.com/path?q=${q}&user=${user}&filter=${filter}`;
// => "https://site.com/path?q=my+search"
```

```ts
import { UrlBuilder } from "@mcansh/url";

new UrlBuilder()
  .domain("site.com")
  .path("/path")
  .param("q", "my search")
  .param<number>("userId", 5)
  .param<string>("filter", "category")
  .build();
// => "https://site.com/path?q=my+search&userId=5&filter=category"
```
