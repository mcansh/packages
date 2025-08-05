# @mcansh/vite-plugin-attributes

Remove `data-testid` and any other attributes with ease.

## Installation

```shell
npm install @mcansh/vite-plugin-attributes
```

## Usage and configuration

By default it will remove `data-testid` attributes when process.env.NODE_ENV === 'production', which is the case when you run `vite build`. however you can customize the attributes to remove by passing an array of attribute names to the plugin options as well as enabling it based on any condition.

```diff
// vite.config.ts

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { removeAttributesPlugin } from "@mcansh/vite-plugin-attributes";

export default defineConfig({
  plugins: [
      reactRouter(),
      tsconfigPaths(),
      tailwindcss()
  ],
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    tailwindcss(),
+   removeAttributesPlugin(),
  ],
});
```
