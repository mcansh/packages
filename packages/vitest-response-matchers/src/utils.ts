export function getHeaders(response: Response | { headers?: HeadersInit }) {
  if (response.headers instanceof Headers) return response.headers;
  return new Headers(response.headers);
}

export function verifyResponse(response: unknown) {
  return {
    message: () => `Expected a Response, but received ${typeof response}`,
    pass: !(response instanceof Response),
  };
}
