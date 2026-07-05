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

  await page.getByRole("button", { name: "Search" }).click()
  await expect(page.getByPlaceholder("City, state, or remote")).toBeVisible()
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
