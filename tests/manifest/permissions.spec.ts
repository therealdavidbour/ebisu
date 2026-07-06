import { readFile } from "node:fs/promises"

import { expect, test } from "@playwright/test"

test("published manifest does not request all URLs", async () => {
  const manifest = JSON.parse(await readFile("build/chrome-mv3-prod/manifest.json", "utf8"))
  const serialized = JSON.stringify(manifest)

  expect(serialized).not.toContain("<all_urls>")
  expect(manifest.host_permissions).toEqual([
    "https://www.google.com/*",
    "https://greenhouse.io/*",
    "https://*.greenhouse.io/*",
    "https://jobs.lever.co/*",
    "https://ashbyhq.com/*",
    "https://*.ashbyhq.com/*",
    "https://myworkdayjobs.com/*",
    "https://*.myworkdayjobs.com/*"
  ])
})

test("ATS toolbar content script only matches supported ATS hosts", async () => {
  const manifest = JSON.parse(await readFile("build/chrome-mv3-prod/manifest.json", "utf8"))
  const atsScript = manifest.content_scripts.find((script: { js?: string[] }) => script.js?.some((file) => file.startsWith("ats-page.")))

  expect(atsScript?.matches).toEqual([
    "https://greenhouse.io/*",
    "https://*.greenhouse.io/*",
    "https://jobs.lever.co/*",
    "https://ashbyhq.com/*",
    "https://*.ashbyhq.com/*",
    "https://myworkdayjobs.com/*",
    "https://*.myworkdayjobs.com/*"
  ])
})
