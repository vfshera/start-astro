import fs from "node:fs/promises";
import { glob } from "tinyglobby";
import { Template, templateSchema } from "./schema";
import path from "node:path";
import { x } from "tinyexec";
import { BLANK_TEMPLATE_NAME, BUILD_TEMPLATES_DIR } from "./constants";
import defu from "defu";
import { setTimeout as sleep } from "node:timers/promises";

import { spinner } from "@clack/prompts";
const s = spinner();

export async function pathExists(path: string) {
  try {
    await fs.access(path, fs.constants.F_OK);

    return true;
  } catch {
    return false;
  }
}

export function getTimestampVersion() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  const hours = String(now.getHours()).padStart(2, "0");

  const minutes = String(now.getMinutes()).padStart(2, "0");

  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}.${month}.${day}.${hours}${minutes}/${seconds}`;
}

export function sortPackageJson(pkg: Record<string, unknown>) {
  const preferredOrder = [
    "name",
    "description",
    "version",
    "type",
    "main",
    "scripts",
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "keywords",
    "author",
    "license",
  ];

  return Object.fromEntries(
    Object.entries(pkg).sort(([keyA], [keyB]) => {
      const indexA = preferredOrder.indexOf(keyA);

      const indexB = preferredOrder.indexOf(keyB);

      return (
        (indexA === -1 ? Infinity : indexA) -
        (indexB === -1 ? Infinity : indexB)
      );
    })
  );
}

type TemplateWithPath = Template & { path: string };

export async function generateTemplate(
  template: TemplateWithPath,
  destinationDir: string,
  starterPath: string,
  extendedTemplates: TemplateWithPath[] = []
) {
  const _templates = [...extendedTemplates, template];

  const contents: { from: string; to: string }[] = [];

  const dependencies = [...new Set(_templates.flatMap((t) => t.dependencies))];

  const devDependencies = [
    ...new Set(_templates.flatMap((t) => t.devDependencies)),
  ];

  for (const t of _templates) {
    const result = await glob(`${t.path}/**/*`, {
      ignore: [`${t.path}/template.json`],
    });

    const tcontents = result.map((f) => {
      const relativePath = path.relative(t.path, f);

      return {
        from: path.join(t.path, relativePath),
        to: path.join(destinationDir, relativePath),
      };
    });

    contents.push(...tcontents);
  }

  await x("cp", ["-r", starterPath, destinationDir]);
  await sleep(500);

  for (const { from, to } of contents) {
    if (!(await pathExists(to))) {
      await fs.mkdir(path.dirname(to), { recursive: true });
    }

    await x("cp", [from, to]);

    await sleep(200);
  }

  if (dependencies.length) {
    s.start("installing dependencies");
    await x("pnpm", ["add", ...dependencies], {
      nodeOptions: { cwd: destinationDir },
    });
    s.stop("dependencies installed!");
  }

  if (devDependencies.length) {
    s.start("installing dev dependencies");
    await x("pnpm", ["add", "-D", ...devDependencies], {
      nodeOptions: { cwd: destinationDir },
    });
    s.stop("dev dependencies installed!");
  }

  s.start("creating readme");
  const readmeContents = createReadme(template);

  await fs.writeFile(path.join(destinationDir, "README.md"), readmeContents);
  s.stop("readme created!");

  s.start("updating package.json");
  const packageJsonPath = path.join(destinationDir, "package.json");

  const packageJsonContents = JSON.parse(
    await fs.readFile(packageJsonPath, "utf-8")
  );

  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(
      sortPackageJson({
        ...packageJsonContents,
        name: template.name,
      }),
      null,
      2
    )
  );

  s.stop("package.json updated!");
}

export async function createBlankTemplate(scriptDir: string) {
  await sleep(100);
  s.start("creating a blank template");
  try {
    await x(
      "pnpm",
      [
        "create",
        "astro@latest",
        "--no-git",
        "--no-install",
        "--template",
        "minimal",
        BLANK_TEMPLATE_NAME,
      ],
      { nodeOptions: { cwd: scriptDir } }
    );
    s.stop("blank template created!");
    await sleep(100);
    s.start("updating tsconfig.json");
    const tsconfigPath = path.join(
      scriptDir,
      BLANK_TEMPLATE_NAME,
      "tsconfig.json"
    );

    const tsconfigContents = JSON.parse(
      await fs.readFile(tsconfigPath, "utf-8")
    );

    await fs.writeFile(
      tsconfigPath,
      JSON.stringify(
        defu(tsconfigContents, {
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "~/*": ["src/*"],
            },
          },
        }),
        null,
        2
      )
    );
    s.stop("tsconfig.json updated!");
  } catch (e) {
    s.stop("Failed to create a blank template");
  }
}

export async function cleanUp(scriptDir: string) {
  await x("rm", ["-rf", BLANK_TEMPLATE_NAME], {
    nodeOptions: { cwd: scriptDir },
  });
}

export async function prepare(scriptDir: string) {
  await cleanUp(scriptDir);

  await sleep(200);

  const buildTemplatesDir = path.join(scriptDir, "..", BUILD_TEMPLATES_DIR);

  if (await pathExists(buildTemplatesDir)) {
    await x("rm", ["-rf", buildTemplatesDir]);
  }

  await x("mkdir", [BUILD_TEMPLATES_DIR]);

  await sleep(200);

  await createBlankTemplate(scriptDir);
}

export async function loadTemplates(templatesDir: string) {
  const templates = [...new Set(await glob(`${templatesDir}/*/template.json`))];

  return Promise.all(
    templates.map(async (template) => {
      const templateJsonPath = path.join(
        templatesDir,
        path.relative(templatesDir, template)
      );

      const info = templateSchema.parse(
        JSON.parse(await fs.readFile(templateJsonPath, "utf-8"))
      );

      return {
        ...info,
        path: path.dirname(templateJsonPath),
      };
    })
  );
}

export function createReadme(template: Template) {
  return `# ${template.title}
${template.description}

## Create your new Astro project by running.
\`\`\`sh
pnpm create astro@latest --template vfshera/start-astro/apps/${template.name}
\`\`\`

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| \`pnpm install\`         | Installs dependencies                            |
| \`pnpm dev\`             | Starts local dev server at \`localhost:4321\`      |
| \`pnpm build\`           | Build your production site to \`./dist/\`          |
| \`pnpm preview\`         | Preview your build locally, before deploying     |
| \`pnpm astro ...\`       | Run CLI commands like \`astro add\`, \`astro check\` |
| \`pnpm astro -- --help\` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check Astro [documentation](https://docs.astro.build) or [Discord server](https://astro.build/chat).
`;
}

export async function createRootReadme(
  templates: Template[],
  rootPath: string
) {
  const readmeContents = `# Start Astro
Starter templates for Astro
 

| Template                | Description                                           |
| :--------------------- | :----------------------------------------------- | 
${templates
  .map(
    (t) =>
      `| [${t.title}](https://github.com/vfshera/start-astro/tree/main/apps/${t.name}) | ${t.description} |`
  )
  .join("\n")}

  > Updated on ${new Date().toLocaleDateString()}

  License [MIT](https://github.com/vfshera/start-astro/blob/main/LICENSE)
`;

  await fs.writeFile(path.join(rootPath, "README.md"), readmeContents);
}
