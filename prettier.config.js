/** @type {import('@trivago/prettier-plugin-sort-imports').PrettierConfig} */
export default {
  plugins: [
    "@trivago/prettier-plugin-sort-imports",
    "prettier-plugin-sort-package-json",
    "prettier-plugin-tailwindcss",
  ],
  importOrderCaseInsensitive: true,
  importOrderSeparation: true,
  importOrder: ["<THIRD_PARTY_MODULES>", "^[#|./]"],
};
