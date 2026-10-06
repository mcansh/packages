export async function createHash(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(input),
  );

  let arrayBuffer = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  );

  return arrayBuffer.join("").toUpperCase();
}
