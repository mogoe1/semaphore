import eslint from '@eslint/js';
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/typedef": ["error", {
        arrayDestructuring: true,
        arrowParameter: true,
        memberVariableDeclaration: true,
        objectDestructuring: true,
        parameter: true,
        propertyDeclaration: true,
        variableDeclaration: true,
        variableDeclarationIgnoreFunction: true,
      }],
      "comma-dangle": ["error", "always-multiline"],
    },
    ignores:[
      "lib/**",
      "typedoc.config.mjs",
    ]
  },
);