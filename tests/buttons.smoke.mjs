import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { compile } from "@tailwindcss/node";

const root = process.cwd();
const componentFiles = [
  "src/renderer/src/components/ui/Button.tsx",
  "src/renderer/src/components/ui/IconButton.tsx",
  "src/renderer/src/components/shared/form/Toggle.tsx",
];
const sources = await Promise.all(componentFiles.map((name) => fs.readFile(name, "utf8")));
const require = createRequire(
  process.env.PLAYWRIGHT_PACKAGE_JSON ?? path.join(root, "package.json"),
);
const { chromium } = require("playwright");
const contents = [
  'import React from "react";',
  'import { createRoot } from "react-dom/client";',
  'import { Button } from "./src/renderer/src/components/ui/Button";',
  'import { IconButton } from "./src/renderer/src/components/ui/IconButton";',
  'import { Toggle } from "./src/renderer/src/components/shared/form/Toggle";',
  "window.activations = 0;",
  "const click = () => { window.activations++; };",
  "const cells = [];",
  "const add = (name, Component, props) => {",
  '  for (const state of ["enabled", "disabled", "aria"]) {',
  '    if (Component === Toggle && state === "aria") continue;',
  '    const blocked = state === "disabled" ? { disabled: true } : state === "aria" ? { "aria-disabled": true } : {};',
  '    cells.push(React.createElement("div", { key: name + state, "data-case": name + "-" + state, style: { padding: 8 } }, React.createElement(Component, { ...props, ...blocked, onClick: click, onChange: click }, "Action")));',
  "  }",
  "};",
  'for (const variant of ["primary", "secondary", "warning", "danger", "ghost"]) add(variant, Button, { variant, disabledReason: "Unavailable action" });',
  'add("icon", IconButton, { label: "Icon", disabledReason: "Unavailable action" });',
  'add("danger-icon", IconButton, { label: "Danger icon", danger: true, disabledReason: "Unavailable action" });',
  'add("toggle-off", Toggle, { label: "Off", checked: false });',
  'add("toggle-on", Toggle, { label: "On", checked: true });',
  'createRoot(document.getElementById("root")).render(React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 } }, cells));',
].join("\n");
const output = await build({
  stdin: { contents, resolveDir: root, loader: "jsx" },
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
});
const cssPath = path.join(root, "src/renderer/src/styles/index.css");
const compiler = await compile(await fs.readFile(cssPath, "utf8"), {
  base: path.dirname(cssPath),
  onDependency: () => undefined,
});
const tooltip = await fs.readFile("src/renderer/src/components/ui/Tooltip.tsx", "utf8");
const css = compiler.build([...sources, tooltip].join("\n").split(/[\s"']+/));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
  args: process.env.CHROMIUM_ARGS_JSON
    ? JSON.parse(process.env.CHROMIUM_ARGS_JSON)
    : ["--no-sandbox"],
});
let checked = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1300, height: 1200 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: output.outputFiles[0].text });
  await page.waitForSelector('[data-case="primary-disabled"] button');
  const appearance = (button) =>
    button.evaluate((element) => {
      const pick = (style) =>
        Object.fromEntries(
          [
            "background",
            "borderColor",
            "color",
            "boxShadow",
            "transform",
            "scale",
            "translate",
            "cursor",
            "animationName",
            "left",
            "opacity",
          ].map((key) => [key, style[key]]),
        );
      return {
        button: pick(getComputedStyle(element)),
        before: pick(getComputedStyle(element, "::before")),
        child: element.querySelector("span")
          ? pick(getComputedStyle(element.querySelector("span")))
          : null,
      };
    });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => document.documentElement.classList.toggle("dark", theme === "dark"),
      theme,
    );
    for (const name of [
      "primary",
      "secondary",
      "warning",
      "danger",
      "ghost",
      "icon",
      "danger-icon",
      "toggle-off",
      "toggle-on",
    ]) {
      for (const state of name.startsWith("toggle")
        ? ["enabled", "disabled"]
        : ["enabled", "disabled", "aria"]) {
        const button = page.locator('[data-case="' + name + "-" + state + '"] button');
        await page.mouse.move(1290, 1190);
        await page.waitForTimeout(550);
        const before = await appearance(button);
        await button.hover({ force: true });
        await page.waitForTimeout(550);
        const after = await appearance(button);
        const count = await page.evaluate(() => window.activations);
        if (state !== "enabled") {
          assert.equal(await button.isDisabled(), true);
          assert.deepEqual(after, before, theme + ":" + name + ":" + state);
          assert.equal(after.button.cursor, "not-allowed");
          await button.evaluate((element) => {
            element.click();
            element.focus();
          });
          await page.keyboard.press("Enter");
          await page.keyboard.press("Space");
          assert.equal(await page.evaluate(() => window.activations), count);
          if (!name.startsWith("toggle")) {
            assert.equal(await page.getByRole("tooltip").textContent(), "Unavailable action");
            const wrapper = button.locator("..");
            assert.equal(await wrapper.evaluate((element) => element.tabIndex), 0);
            await wrapper.focus();
            assert.equal(await page.getByRole("tooltip").textContent(), "Unavailable action");
            await wrapper.evaluate((element) => element.blur());
          }
        } else {
          if (name !== "toggle-on") assert.notDeepEqual(after, before);
          await button.click();
          await button.focus();
          await page.keyboard.press("Enter");
          await page.keyboard.press("Space");
          assert.equal(await page.evaluate(() => window.activations), count + 3);
          await button.evaluate((element) => element.blur());
        }
        checked++;
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ cases: checked, themes: ["light", "dark"], runtimeErrors: errors }));
} finally {
  await browser.close();
}
