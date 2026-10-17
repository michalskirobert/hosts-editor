import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
const req = createRequire(
  process.env.PLAYWRIGHT_PACKAGE_JSON ?? path.join(process.cwd(), "package.json"),
);
const { chromium } = req("playwright");
const base = path.join(process.cwd(), "out", "renderer");
const artifacts =
  process.env.QA_ARTIFACT_DIR ?? fs.mkdtempSync(path.join(os.tmpdir(), "hosts-editor-ui-"));
fs.mkdirSync(artifacts, { recursive: true });
const checks = [];
(async () => {
  const server = http
    .createServer((request, response) => {
      const file = path.join(
        base,
        decodeURIComponent(
          request.url.split("?")[0] === "/" ? "/index.html" : request.url.split("?")[0],
        ),
      );
      if (!file.startsWith(base) || !fs.existsSync(file)) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".png")
              ? "image/png"
              : "text/html",
      );
      fs.createReadStream(file).pipe(response);
    })
    .listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
    args: JSON.parse(process.env.CHROMIUM_ARGS_JSON ?? "[]"),
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1320, height: 840 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const lines = Array.from({ length: 70 }, (_, i) => ({
        id: `line-${i}`,
        kind: "host",
        enabled: true,
        address: "127.0.0.1",
        hostname: `host${i}.test`,
        comment: i === 2 ? "long ".repeat(80) + "needle" : `note ${i}`,
        raw: "",
      }));
      const tab = {
        id: "fixture",
        name: "Fixture",
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lines,
      };
      const listeners = new Set();
      const qa = (window.qa = {
        tabs: [tab],
        updates: { status: "idle" },
        saves: 0,
        applies: 0,
        installs: 0,
        captchaCalls: 0,
        submissions: 0,
        failApply: false,
      });
      qa.emit = (value) => {
        qa.updates = { ...qa.updates, ...value };
        for (const listener of listeners) listener(qa.updates);
      };
      window.hostsEditor = {
        bootstrap: async () => ({
          tabs: qa.tabs,
          settings: {
            theme: "light",
            fullscreen: false,
            checkForUpdates: false,
            autoBackupOnSave: true,
          },
          hostsPath: "/isolated/hosts",
          version: "2.3.1",
        }),
        saveTab: async (tab) => {
          qa.saves++;
          qa.tabs = qa.tabs.map((item) => (item.id === tab.id ? tab : item));
          return tab;
        },
        saveTabAndApply: async (tab) => {
          if (qa.failApply) throw Error("Mock permission denied");
          qa.applies++;
          return tab;
        },
        createTab: async (name) => ({ ...tab, id: crypto.randomUUID(), name, lines: [] }),
        deleteTab: async () => undefined,
        importHosts: async () => "127.0.0.1 imported.test",
        listBackups: async () => [],
        createBackup: async () => ({}),
        readBackup: async () => ({}),
        restoreBackup: async () => tab,
        deleteBackup: async () => undefined,
        exportBackup: async () => true,
        exportAllBackups: async () => true,
        importBackups: async () => null,
        openBackups: async () => undefined,
        saveSettings: async (value) => value,
        getUpdateState: async () => window.qa.updates,
        onUpdateState: (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        checkUpdate: async () => {
          qa.emit({
            status: "available",
            version: "2.4.0",
            packageType: "dmg",
            installSupported: true,
            message: "Hosts Editor 2.4.0 is available.",
          });
          return qa.updates;
        },
        downloadUpdate: async () => {
          qa.emit({
            status: "downloading",
            progress: { percent: 37, transferred: 37, total: 100 },
          });
          return qa.updates;
        },
        installUpdate: async () => {
          qa.installs++;
          return qa.updates;
        },
        setUpdateSafety: async (dirty, busy) => {
          qa.safety = { dirty, busy };
        },
        cancelUpdate: async () => {
          qa.emit({ status: "cancelled", message: "Download cancelled." });
          return qa.updates;
        },
        openUpdate: async () => {
          qa.opened = (qa.opened ?? 0) + 1;
          if (qa.openError) throw new Error(qa.openError);
        },
        showUpdateInFolder: async () => {
          qa.shown = (qa.shown ?? 0) + 1;
        },
        setFullscreen: async () => undefined,
        openExternal: async () => undefined,
        getFeedbackCaptcha: async () => {
          qa.captchaCalls++;
          await new Promise((resolve) => setTimeout(resolve, 500));
          return qa.captchaCalls === 1
            ? { ok: false, message: "Test CAPTCHA unavailable" }
            : {
                ok: true,
                captcha: {
                  token: "fixture-token",
                  imageDataUrl:
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+k6m8AAAAASUVORK5CYII=",
                },
              };
        },
        submitFeedback: async () => {
          qa.submissions++;
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { ok: true, result: { reportId: "fixture-report" } };
        },
      };
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.getByRole("button", { name: "Text", exact: true }).waitFor();
    assert.equal(await page.locator("[data-host-id]").count(), 70);
    checks.push("Bootstrap and Objects rendering");
    const search = page.getByRole("textbox", { name: "Search hosts", exact: true });
    await search.fill("host1.test");
    assert.equal(await page.locator("[data-host-id]").count(), 1);
    const clear = page.getByRole("button", { name: "Clear search", exact: true });
    const before = await clear.boundingBox();
    await clear.hover();
    await page.waitForTimeout(250);
    const after = await clear.boundingBox();
    assert.deepEqual(after, before);
    await clear.click();
    assert.equal(await page.locator("[data-host-id]").count(), 70);
    checks.push("Objects filter/clear and stable clear-button geometry on hover");
    const modeBefore = await page.getByRole("button", { name: "Text", exact: true }).boundingBox();
    await page.getByRole("button", { name: "Text", exact: true }).click();
    assert.deepEqual(
      await page.getByRole("button", { name: "Text", exact: true }).boundingBox(),
      modeBefore,
    );
    checks.push("Stable Objects/Text capsule");
    const raw = page.getByRole("textbox", { name: "Hosts file text" });
    const text = await raw.inputValue();
    const find = page.getByRole("textbox", { name: "Find in hosts", exact: true });
    await find.fill("host");
    assert.equal(await find.evaluate((el) => el === document.activeElement), true);
    assert.equal(await page.locator("mark").count(), 70);
    assert.equal(await raw.inputValue(), text);
    await find.press("Enter");
    assert.equal(await find.evaluate((el) => el === document.activeElement), true);
    assert.equal(
      await page.locator('mark[data-match="1"]').evaluate((el) => el.className.includes("outline")),
      true,
    );
    await find.press("Shift+Enter");
    await find.press("Shift+Enter");
    assert.equal(
      await page
        .locator('mark[data-match="69"]')
        .evaluate((el) => el.className.includes("outline")),
      true,
    );
    assert.ok((await raw.evaluate((el) => el.scrollTop)) > 0);
    checks.push(
      "All highlights, keyboard focus, Enter/Shift+Enter, wrapping and active-match scroll",
    );
    await page.getByRole("button", { name: "Next match", exact: true }).click();
    assert.equal(await find.evaluate((el) => el === document.activeElement), true);
    checks.push("Match buttons retain Search focus");
    await find.fill("needle");
    const active = page.locator('mark[data-match="0"]');
    const rect = await active.boundingBox();
    const rawRect = await raw.boundingBox();
    assert.ok(rect.y >= rawRect.y && rect.y + rect.height <= rawRect.y + rawRect.height);
    checks.push("Wrapped long-line match remains within editor viewport");
    const metric = await page.evaluate(() => {
      const a = document.querySelector("textarea");
      const b = document.querySelector('[aria-hidden="true"] > div[style]');
      return {
        a: a && getComputedStyle(a).cssText,
        b: b && getComputedStyle(b).cssText,
        fontA: getComputedStyle(a).font,
        fontB: getComputedStyle(b).font,
        widthA: a.clientWidth,
        widthB: b.getBoundingClientRect().width,
        mirror: b.textContent,
      };
    });
    assert.equal(metric.fontA, metric.fontB);
    assert.equal(metric.widthA, metric.widthB);
    assert.equal(metric.mirror, text + "\u200b");
    checks.push("Overlay typography, width, whitespace and original content parity");
    await page.screenshot({ path: path.join(artifacts, "light.png") });
    await page.setViewportSize({ width: 1000, height: 650 });
    await find.fill("host");
    assert.equal(await find.evaluate((el) => el === document.activeElement), true);
    await page.getByRole("button", { name: "Previous match", exact: true }).click();
    const narrowActive = await page.locator('mark[data-match="69"]').boundingBox();
    const narrowRaw = await raw.boundingBox();
    assert.ok(narrowActive.y >= narrowRaw.y && narrowActive.y < narrowRaw.y + narrowRaw.height);
    checks.push("Search after viewport resize to 1000×650");
    await page.screenshot({ path: path.join(artifacts, "narrow-editor.png") });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    assert.equal(await page.locator("html").evaluate((el) => el.classList.contains("dark")), true);
    assert.equal(
      await page
        .locator("body > #root > div")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(5, 8, 14)",
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifacts, "dark-settings.png") });
    checks.push("Light and Dark appearance switching");
    await page.getByRole("button", { name: "Check for updates", exact: true }).click();
    await page.getByRole("button", { name: "Download Update", exact: true }).click();
    assert.equal(await page.getByRole("progressbar").getAttribute("value"), "37");
    await page.evaluate(() => window.qa.emit({ status: "downloaded" }));
    await page.getByRole("button", { name: "Restart & Install", exact: true }).waitFor();
    checks.push("Update available/download/progress/ready UI states");
    await page.getByRole("button", { name: "Hosts", exact: true }).click();
    const notice = page.getByRole("dialog", { name: "Update ready to install" });
    await notice.getByRole("button", { name: "Later", exact: true }).click();
    await raw.fill(text + "\n127.0.0.1 new.test");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByRole("button", { name: "Restart & Install", exact: true }).click();
    const unsaved = page.getByRole("dialog", { name: "Unsaved changes before restart" });
    await unsaved.waitFor();
    assert.equal(await page.evaluate(() => window.qa.installs), 0);
    await unsaved.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.equal(await page.evaluate(() => window.qa.installs), 0);
    checks.push("Dirty restart confirmation and Cancel");
    await page.evaluate(() => (window.qa.failApply = true));
    await page.getByRole("button", { name: "Restart & Install", exact: true }).click();
    await page.getByRole("button", { name: "Save & Install", exact: true }).click();
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.qa.installs), 0);
    await page
      .getByRole("dialog", { name: "Unsaved changes before restart" })
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    checks.push("Failed Save blocks installation");
    await page.getByRole("button", { name: "Restart & Install", exact: true }).click();
    await page.getByRole("button", { name: "Discard & Install", exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.qa.installs), 1);
    assert.equal(await page.evaluate(() => window.qa.applies), 0);
    await page
      .getByRole("dialog", { name: "Unsaved changes before restart" })
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    checks.push("Explicit Discard & Install restores snapshots without writing system hosts");
    await page.evaluate(() =>
      window.qa.emit({
        status: "available",
        version: "2.4.0",
        packageType: "dmg",
        installSupported: false,
        message: "Hosts Editor 2.4.0 is available.",
      }),
    );
    await page.getByRole("button", { name: "Download Update", exact: true }).click();
    await page.getByRole("button", { name: "Cancel download", exact: true }).click();
    await page.getByRole("button", { name: "Download Update", exact: true }).waitFor();
    await page.getByRole("button", { name: "Download Update", exact: true }).click();
    await page.evaluate(() =>
      window.qa.emit({
        status: "downloaded",
        message: "Hosts Editor 2.4.0 is ready. Open the downloaded installer to continue.",
      }),
    );
    assert.equal(
      await page.getByRole("button", { name: "Restart & Install", exact: true }).count(),
      0,
    );
    await page.getByRole("button", { name: "Open Installer", exact: true }).click();
    await page.getByRole("button", { name: "Show in Folder", exact: true }).click();
    assert.equal(await page.evaluate(() => window.qa.opened), 1);
    assert.equal(await page.evaluate(() => window.qa.shown), 1);
    checks.push(
      "Direct installer progress, cancellation, retry, Open Installer and Show in Folder",
    );
    await page.evaluate(() => {
      window.qa.openError = "The system could not open the installer.";
    });
    await page.getByRole("button", { name: "Open Installer", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "The system could not open the installer." })
      .first()
      .waitFor();
    checks.push("Installer opening failure is shown inline");
    await page.getByRole("button", { name: /^Notifications/ }).click();
    const notificationDialog = page.getByRole("dialog", { name: "Notifications", exact: true });
    assert.equal(
      await notificationDialog
        .getByRole("listitem")
        .filter({ hasText: "Hosts Editor 2.4.0" })
        .count(),
      1,
    );
    await page.screenshot({ path: path.join(artifacts, "notification-center.png") });
    await notificationDialog
      .getByRole("button", { name: "Open updates", exact: true })
      .first()
      .click();
    await notificationDialog.waitFor({ state: "hidden" });
    checks.push("One update notification advances from available to downloaded and opens Updates");
    await page.evaluate(() => window.qa.emit({ status: "current" }));
    await page.getByRole("button", { name: "Send feedback", exact: true }).click();
    let feedback = page.getByRole("dialog", { name: "Report a bug", exact: true });
    await feedback.waitFor();
    assert.equal(
      await feedback
        .locator("textarea")
        .first()
        .evaluate((el) => getComputedStyle(el).resize),
      "none",
    );
    const modalGeometry = await feedback.evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      viewport: innerHeight,
      scroll: el.querySelector("div.overflow-y-auto").scrollTop,
    }));
    assert.ok(modalGeometry.top >= 15 && modalGeometry.bottom <= modalGeometry.viewport - 15);
    assert.equal(modalGeometry.scroll, 0);
    checks.push("Feedback dialog opens at the top and textareas have no resize handle");
    await page.screenshot({ path: path.join(artifacts, "report-bug.png") });

    assert.equal(await feedback.getByPlaceholder("Loading security check…").isDisabled(), true);
    await feedback.getByRole("button", { name: "Retry", exact: true }).waitFor();
    await feedback.getByRole("button", { name: "Retry", exact: true }).click();
    await feedback.getByPlaceholder("CAPTCHA", { exact: true }).waitFor();
    await page.waitForTimeout(550);
    assert.equal(await feedback.getByPlaceholder("CAPTCHA", { exact: true }).isDisabled(), false);
    checks.push("CAPTCHA loading/error/retry/input availability");
    await feedback.getByRole("radio", { name: "Feature request Suggest an improvement" }).click();
    feedback = page.getByRole("dialog", { name: "Suggest a feature", exact: true });
    await feedback.getByLabel("Your email").fill("fixture@example.com");
    await feedback.getByLabel("Short description").fill("Fixture feature request");
    await feedback.getByLabel("Your suggestion").fill("This is an isolated test submission.");
    await feedback.getByPlaceholder("CAPTCHA", { exact: true }).fill("test");
    await feedback
      .getByRole("button", { name: "Send feedback", exact: true })
      .dblclick({ force: true });
    await page.getByRole("dialog", { name: "Feedback sent", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.qa.submissions), 1);
    checks.push("Feature-request validation, single submission and success state");
    feedback = page.getByRole("dialog", { name: "Feedback sent", exact: true });
    await page.keyboard.press("Escape");
    await feedback.waitFor({ state: "hidden" });
    assert.equal(
      await page
        .getByRole("button", { name: "Send feedback", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    checks.push("Modal Escape and focus restoration");
    await page.getByRole("button", { name: "Hosts", exact: true }).click();
    await page.getByRole("button", { name: "Objects", exact: true }).click();
    await page.getByRole("textbox", { name: "Search hosts", exact: true }).fill("");
    const toolbar = page.locator(".sticky").first();
    const style = await toolbar.evaluate((el) => ({
      position: getComputedStyle(el).position,
      bg: getComputedStyle(el).backgroundColor,
      shadow: getComputedStyle(el).boxShadow,
      blur: getComputedStyle(el).backdropFilter,
    }));
    assert.deepEqual(style, {
      position: "sticky",
      bg: "rgba(0, 0, 0, 0)",
      shadow: "none",
      blur: "none",
    });
    await page
      .locator("main > div")
      .first()
      .evaluate((el) => (el.scrollTop = 600));
    await page.waitForTimeout(100);
    assert.ok((await toolbar.boundingBox()).y >= 75);
    checks.push("Transparent sticky Search toolbar during Objects scrolling");
    await page
      .locator("main > div")
      .first()
      .evaluate((el) => (el.scrollTop = 0));
    await page.getByRole("button", { name: "Backup", exact: true }).click();
    const toast = page.getByRole("status").filter({ hasText: "Manual backup created" });
    await toast.hover();
    await page.waitForTimeout(3200);
    assert.equal(await toast.isVisible(), true);
    await toast.getByRole("button", { name: "Dismiss notification" }).focus();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(3200);
    assert.equal(await toast.isVisible(), true);
    await page.getByRole("textbox", { name: "Search hosts", exact: true }).focus();
    await page.waitForTimeout(3300);
    assert.equal(await toast.count(), 0);
    checks.push("Toast hover/focus pause and resumed dismissal");
    assert.deepEqual(errors, []);
    checks.push("No renderer runtime errors");
    fs.writeFileSync(
      path.join(artifacts, "renderer-results.json"),
      JSON.stringify({ checks, errors }, null, 2),
    );
    console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  console.log("Completed checks:", checks);
  process.exitCode = 1;
});
