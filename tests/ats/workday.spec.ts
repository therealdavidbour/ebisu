import { expect, test } from "@playwright/test"

import { DEFAULT_ATS_SITES } from "../../src/ats"
import { isSupportedAtsUrl } from "../../src/content-utils"
import { buildJobSearchQuery } from "../../src/query"

test("Workday is included in the default ATS query", () => {
  const query = buildJobSearchQuery({
    roles: ["software engineer"],
    atsSites: DEFAULT_ATS_SITES,
    excludedTerms: []
  })

  expect(query).toContain("site:myworkdayjobs.com")
})

test("Workday job pages are recognized as supported ATS URLs", () => {
  expect(isSupportedAtsUrl("https://company.wd1.myworkdayjobs.com/en-US/careers/job/software-engineer")).toBe(true)
  expect(isSupportedAtsUrl("https://company.wd5.myworkdayjobs.com/jobs/job/senior-engineer")).toBe(true)
  expect(isSupportedAtsUrl("https://myworkdayjobs.com/company/job/software-engineer")).toBe(true)
})

test("non-Workday lookalike hosts are not treated as Workday ATS URLs", () => {
  expect(isSupportedAtsUrl("https://myworkdayjobs.com.example.com/company/job/software-engineer")).toBe(false)
})
