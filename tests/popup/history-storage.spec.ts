import { expect, test } from "@playwright/test"

test("history reads per-job storage records", async ({ page }) => {
  await page.addInitScript(() => {
    const values: Record<string, unknown> = {
      "job:https://jobs.lever.co/example/one": {
        id: "https://jobs.lever.co/example/one",
        url: "https://jobs.lever.co/example/one",
        canonicalUrl: "https://jobs.lever.co/example/one",
        title: "One",
        source: "jobs.lever.co",
        status: "seen",
        firstSeenAt: "2026-07-05T08:00:00.000-07:00",
        lastSeenAt: "2026-07-05T08:00:00.000-07:00"
      },
      "job:https://company.wd1.myworkdayjobs.com/jobs/two": {
        id: "https://company.wd1.myworkdayjobs.com/jobs/two",
        url: "https://company.wd1.myworkdayjobs.com/jobs/two",
        canonicalUrl: "https://company.wd1.myworkdayjobs.com/jobs/two",
        title: "Two",
        source: "company.wd1.myworkdayjobs.com",
        status: "saved",
        firstSeenAt: "2026-07-05T09:00:00.000-07:00",
        lastSeenAt: "2026-07-05T09:00:00.000-07:00"
      }
    }

    window.chrome = ({
      runtime: {
        getManifest: () => ({ manifest_version: 3, name: "Ebisu", version: "0.0.1" })
      },
      storage: {
        local: {
          get: async (keys?: string | string[] | null) => {
            if (!keys) {
              return { ...values }
            }

            if (typeof keys === "string") {
              return { [keys]: values[keys] }
            }

            return Object.fromEntries(keys.map((key) => [key, values[key]]))
          },
          set: async (items: Record<string, unknown>) => {
            Object.assign(values, items)
          },
          remove: async (keys: string | string[]) => {
            for (const key of Array.isArray(keys) ? keys : [keys]) {
              delete values[key]
            }
          },
          getBytesInUse: async () => 0,
          clear: async () => {
            for (const key of Object.keys(values)) {
              delete values[key]
            }
          }
        },
        onChanged: {
          addListener: () => {},
          removeListener: () => {},
          hasListener: () => false
        }
      }
    } as unknown) as typeof chrome
  })

  await page.goto("/popup.html")
  await page.getByRole("button", { name: "History" }).click()

  await expect(page.getByText("One")).toBeVisible()
  await expect(page.getByText("Two")).toBeVisible()
})
