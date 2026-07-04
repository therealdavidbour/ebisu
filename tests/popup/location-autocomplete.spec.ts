import { expect, test } from "@playwright/test"

test("location autocomplete reopens while the field stays focused", async ({ page }) => {
  await page.goto("/popup.html")

  await page.getByRole("button", { name: "Search" }).click()

  const location = page.getByPlaceholder("City, state, or remote")
  await location.fill("re")

  const remoteSuggestion = page.getByRole("button", { name: /Remote/ })
  await expect(remoteSuggestion).toBeVisible()

  await remoteSuggestion.click()
  await expect(location).toHaveValue("Remote")

  await location.press("Meta+A")
  await location.press("Backspace")
  await location.type("re")

  await expect(remoteSuggestion).toBeVisible()
})
