import { expect, test } from "@playwright/test"

test("popup tab switching shows the correct panel content", async ({ page }) => {
  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()

  await expect(page.getByPlaceholder("Job title, keywords, or company")).toBeVisible()
  await expect(page.getByRole("button", { name: "Go" })).toBeVisible()

  await page.getByRole("button", { name: "History" }).click()
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible()
  await expect(page.getByText("No jobs yet.")).toBeVisible()

  await page.getByRole("button", { name: "Advanced Settings" }).click()
  await expect(page.getByRole("heading", { name: "Advanced Settings" })).toBeVisible()
  await expect(page.getByLabel("Days back")).toHaveValue("1")
  await expect(page.getByLabel("Excluded terms")).toBeVisible()
  await expect(page.getByText("Exclude job aggregators")).toBeVisible()

  await page.getByRole("button", { name: "Search" }).click()
  await expect(page.getByPlaceholder("City, state, or remote")).toBeVisible()
})

test("aggregator exclusions are visible and configurable", async ({ page }) => {
  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()

  await page.getByRole("button", { name: "Advanced Settings" }).click()
  await page.getByRole("button", { name: "View query" }).click()

  const query = page.getByLabel("Generated query")
  await expect(query).toHaveValue(/-site:indeed\.com/)

  await page.getByText("Exclude job aggregators").click()
  await expect(query).not.toHaveValue(/-site:indeed\.com/)
})

test("popup tab panel height stays fixed across tabs", async ({ page }) => {
  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()

  const panel = page.getByTestId("popup-tab-panel")
  const initialBox = await panel.boundingBox()

  expect(initialBox).not.toBeNull()

  await page.getByRole("button", { name: "History" }).click()
  const historyBox = await panel.boundingBox()

  await page.getByRole("button", { name: "Advanced Settings" }).click()
  const advancedBox = await panel.boundingBox()

  expect(historyBox).not.toBeNull()
  expect(advancedBox).not.toBeNull()

  expect(Math.round(historyBox!.height)).toBe(Math.round(initialBox!.height))
  expect(Math.round(advancedBox!.height)).toBe(Math.round(initialBox!.height))
})

test("clear history uses an in-popup Ebisu confirmation dialog", async ({ page }) => {
  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()
  await page.getByRole("button", { name: "History" }).click()

  const clearButton = page.getByRole("button", { name: "Clear Ebisu history" })
  await clearButton.click()

  await expect(page.getByRole("heading", { name: "Clear Ebisu history?" })).toBeVisible()
  await expect(page.getByText("Ebisu history is already empty.")).toBeVisible()

  await page.getByRole("button", { name: "Close" }).click()
  await expect(page.getByRole("heading", { name: "Clear Ebisu history?" })).toHaveCount(0)
})

test("help button opens the Ebisu website", async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as typeof window & { __lastOpenedUrl?: string }).open = ((url?: string | URL) => {
      ;(window as typeof window & { __lastOpenedUrl?: string }).__lastOpenedUrl = String(url)
      return null
    }) as typeof window.open
  })

  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()

  await page.getByRole("button", { name: "Open Ebisu help and privacy page" }).click()

  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { __lastOpenedUrl?: string }).__lastOpenedUrl)
    )
    .toBe("https://therealdavidbour.github.io/ebisu")
})
