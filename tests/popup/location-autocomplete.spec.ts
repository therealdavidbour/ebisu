import { expect, test } from "@playwright/test"

test("location autocomplete reopens while the field stays focused", async ({ page }) => {
  await page.goto("/popup.html")
  await expect(page.getByRole("heading", { name: "Ebisu" })).toBeVisible()

  const location = page.getByPlaceholder("City, state, or remote")
  await expect(location).toBeVisible()
  await location.fill("re")

  const remoteSuggestion = page.getByRole("button", { name: "Remote Workplace" })
  await expect(remoteSuggestion).toBeVisible()

  await remoteSuggestion.click()
  await expect(location).toHaveValue("Remote")

  await location.fill("")
  await location.type("re")

  await expect(remoteSuggestion).toBeVisible()
})
