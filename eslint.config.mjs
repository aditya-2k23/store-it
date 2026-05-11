import next from "eslint-config-next";
import prettier from "eslint-config-prettier/flat";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  ...next,
  // Keep this last so it disables formatting-related rules.
  prettier,
];

export default config;
