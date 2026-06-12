module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./packages/*/tsconfig.json", "./apps/*/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-floating-promises": "warn",
    "@typescript-eslint/no-misused-promises": [
      "warn",
      {
        "checksConditionals": false,
        "checksVoidReturn": false,
      },
    ],
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "arrow-body-style": "off",
    "no-console": "off",
    "no-restricted-syntax": "off",
    "no-await-in-loop": "off",
    "class-methods-use-this": "off",
    "consistent-return": "off",
    "no-param-reassign": [
      "error",
      {
        "props": false,
      },
    ],
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js"],
};