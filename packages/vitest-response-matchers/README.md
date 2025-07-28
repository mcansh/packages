# @mcansh/vitest-response-matchers

Response assertion matchers for vitest

```typescript
expect(new Response("Hello, world!", { status: 200 })).toHaveStatus(200);

expect(new Response(null, { status: 200, statusText: "OK" })).toHaveStatusText(
  "OK",
);

expect(
  new Response("Hello, world!", {
    status: 200,
    statusText: "Not OK",
  }),
).toHaveStrictStatusText();

expect(new Response(null, { status: 200, statusText: "OK" })).toMatchResponse({
  status: 200,
  statusText: "OK",
});

expect(() => {
  throw new Response("Not Found", { status: 404 });
}).toThrowResponse(new Response("Not Found", { status: 404 }));
```
