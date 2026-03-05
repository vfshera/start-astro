# AI Prompts

> **Note for AI:** Before creating any files, check if they already exist. If they do, ask the user for confirmation before overwriting, or offer to merge/back up instead.

## 1. Add ESLint

Add ESLint to an Astro project using ESLint 10 flat config format.

Use this exact config structure (eslint.config.mjs):

```js
import astroEslintParser from "astro-eslint-parser";
import tseslint from "typescript-eslint";
import astroPlugin from "eslint-plugin-astro";
import globals from "globals";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  { ignores: ["dist", ".astro"] },
  astroPlugin.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.browser },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "all",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
```

Required packages:

- eslint
- eslint-config-prettier
- eslint-plugin-astro
- astro-eslint-parser
- typescript-eslint
- globals

---

## 2. Add Prettier

Add Prettier to an Astro project.

Create prettier.config.mjs:

```js
export default {
  plugins: ["prettier-plugin-astro"],
  overrides: [{ files: "*.astro", options: { parser: "astro" } }],
};
```

Required packages:

- prettier
- prettier-plugin-astro

---

## 3. Add SEO

Add SEO support to an Astro project using astro-seo.

> **Note:** Base.astro is the minimal base layout with SEO + global imports. Create additional layouts (like Layout.astro) that extend Base.astro and add more components like Navbar/Footer.

Create src/layouts/Base.astro with:

```astro
---
import { SEO, type Props as AstroSEOProps } from "astro-seo";
import { site } from "~/constants/config";

interface Props extends AstroSEOProps {
  class?: astroHTML.JSX.HTMLAttributes["class"];
  "class:list"?: astroHTML.JSX.HTMLAttributes["class:list"];
  lang?: string;
}

const {
  title,
  description,
  class: className,
  "class:list": classList,
  lang = "en",
  ...props
} = Astro.props;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <SEO
      title={title}
      titleDefault={site.title}
      titleTemplate={`%s - ${site.title}`}
      description={description || site.description}
      {...props}
    />
    <slot name="head" />
  </head>
  <body class:list={[classList, className]}>
    <slot />
  </body>
</html>
```

Required:

- astro-seo package
- create src/constants/config.ts with site config

**Usage example** - Create Layout.astro that extends Base.astro:

```astro
---
import type { ComponentProps } from "astro/types";
import BaseLayout from "./Base.astro";
import TheNavbar from "~/components/TheNavbar.astro";
import TheFooter from "~/components/TheFooter.astro";

interface Props extends ComponentProps<typeof BaseLayout> {}

const { class: className, "class:list": classList, ...props } = Astro.props;
---

<BaseLayout
  {...props}
  class:list={["flex min-h-full flex-col", classList, className]}
>
  <slot name="head" slot="head" />
  <TheNavbar />
  <main class="flex-1">
    <slot />
  </main>
  <TheFooter />
</BaseLayout>
```
