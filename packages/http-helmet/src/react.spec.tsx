import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NonceProvider, useNonce } from "./react";

describe("NonceProvider", () => {
  it("pass and receive nonce", () => {
    function Parent() {
      return (
        <NonceProvider nonce="test-nonce">
          <Child />
        </NonceProvider>
      );
    }

    function Child() {
      const nonce = useNonce();
      return <div data-testid="nonce">{nonce}</div>;
    }

    render(<Parent />);

    expect(screen.getByTestId("nonce")).toHaveTextContent("test-nonce");
  });
});
