import { expect, test } from "@playwright/test"

import { getAfterDate } from "../../src/date"

test("after date is formatted in local time", () => {
  const localEvening = new Date(2026, 6, 5, 17)

  expect(getAfterDate(1, localEvening)).toBe("2026-07-04")
})
