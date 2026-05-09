import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const iconsDir = path.join(repoRoot, "client", "public", "icons");
const outputFile = path.join(repoRoot, "client", "src", "generated", "projectIcons.generated.ts");

const DEFAULT_MILESTONE_ICON = "flag-triangle-right.svg";

const main = async () => {
  const entries = await fs.readdir(iconsDir, { withFileTypes: true });
  const icons = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".svg"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (!icons.includes(DEFAULT_MILESTONE_ICON)) {
    icons.unshift(DEFAULT_MILESTONE_ICON);
  }

  const fileContents = [
    "export const GENERATED_PROJECT_ICON_OPTIONS = [",
    ...icons.map((icon) => `  ${JSON.stringify(icon)},`),
    "] as const;",
    "",
    `export const GENERATED_DEFAULT_MILESTONE_ICON = ${JSON.stringify(DEFAULT_MILESTONE_ICON)};`,
    ""
  ].join("\n");

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, fileContents, "utf8");

  console.log(`Generated ${icons.length} icons into ${path.relative(repoRoot, outputFile)}`);
};

main().catch((error) => {
  console.error("Failed to generate icon manifest", error);
  process.exitCode = 1;
});