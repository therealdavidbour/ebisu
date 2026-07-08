import { readFile } from "node:fs/promises"

const packageJsonPath = new URL("../package.json", import.meta.url)
const runNumber = process.env.GITHUB_RUN_NUMBER
const runAttempt = process.env.GITHUB_RUN_ATTEMPT

if (!runNumber) {
  throw new Error("GITHUB_RUN_NUMBER is required to compute a release version")
}

if (!runAttempt) {
  throw new Error("GITHUB_RUN_ATTEMPT is required to compute a release version")
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
const baseVersion = String(packageJson.version ?? "").trim()
const versionParts = baseVersion.split(".")

if (versionParts.length !== 3 || versionParts.some((part) => !/^\d+$/.test(part))) {
  throw new Error(`Expected package.json version to be MAJOR.MINOR.PATCH, got: ${baseVersion}`)
}

const releaseBuild = Number(runNumber) * 100 + Number(runAttempt)

if (!Number.isInteger(releaseBuild) || releaseBuild <= 0) {
  throw new Error(`Expected positive integer release build, got run=${runNumber} attempt=${runAttempt}`)
}

process.stdout.write(`${baseVersion}.${releaseBuild}\n`)
