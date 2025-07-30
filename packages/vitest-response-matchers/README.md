# @mcansh/vitest-response-matchers

Response assertion matchers for vitest

## Installation

```shell
npm install @mcansh/vitest-response-matchers
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@mcansh/vitest-response-matchers/client"]
  }
}
```

```typescript
// vitest.setup.ts
import "@mcansh/vitest-response-matchers";
```

## Usage

### `toHaveStatus`

Check if the response has a specific status code.

```typescript
let response = new Response("Hello World!");

expect(response).toHaveStatus(200);
```

### `toHaveHeader`

Check if the response has a specific header.

```typescript
let response = new Response("Hello World!", {
  headers: {
    "x-custom-header": "value",
  },
});

expect(response).toHaveHeader("x-custom-header", "value");
```

### `toHaveCookies`

Check if the response has a specific cookie.

```typescript
let response = new Response("Hello World!", {
  headers: {
    "Set-Cookie": "name=value; Path=/",
  },
});

expect(response).toHaveCookies(["name=value; Path=/"]);
```

### `toHaveStatusText`

Check if the response has a specific status text.

```typescript
let response = new Response("Hello World!");

expect(response).toHaveStatusText("OK");
```

### `toHaveStrictStatusText`

Check if the response has a specific status text according to the HTTP specification. (uses node:http)

```typescript
let response = new Response("Hello World!", {
  status: 400,
  statusText: "nah",
});

expect(response).toHaveStrictStatusText("OK"); // fails
```

### `toMatchResponse`

Check if the response matches another response.

```typescript
let response = new Response("Hello World!");

expect(response).toMatchResponse(response);
expect(response).toMatchResponse({ status: 200, statusText: "OK" });
```

### `toHaveTextBody`

Check if the response has a specific text body.

```typescript
let response = new Response("Hello World!");

expect(response).toHaveTextBody("Hello World!");
```

### `toHaveJsonBody`

Check if the response has a specific JSON body.

```typescript
let response = new Response(JSON.stringify({ foo: "bar" }));

expect(response).toHaveJsonBody({ foo: "bar" });
```

### `toThrowResponse`

Check if a function throws a Response

```typescript
function throwResponse() {
  throw new Response("Hello World!");
}

expect(() => throwResponse()).toThrowResponse(new Response("Hello World!"));
```
