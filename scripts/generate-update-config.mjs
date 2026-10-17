import fs from "node:fs/promises";
import yaml from "js-yaml";
import { z } from "zod";

const schema = z.object({
  productName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9 ._-]+$/),
  artifactName: z.literal("${productName}-${version}-${os}-${arch}.${ext}"),
  publish: z.object({
    provider: z.literal("github"),
    owner: z.string().regex(/^[A-Za-z0-9-]+$/),
    repo: z.string().regex(/^[A-Za-z0-9_.-]+$/),
  }),
});
const config = schema.parse(yaml.load(await fs.readFile("electron-builder.yml", "utf8")));
await fs.mkdir("src/shared/config", { recursive: true });
await fs.writeFile(
  "src/shared/config/update-source.json",
  `${JSON.stringify({ productName: config.productName, owner: config.publish.owner, repo: config.publish.repo }, null, 2)}\n`,
);
