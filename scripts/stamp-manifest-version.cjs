const { readFile, writeFile } = require("node:fs/promises")

module.exports = async function stampManifestVersion() {
  const manifestVersion = process.env.EXT_MANIFEST_VERSION

  if (!manifestVersion) {
    return
  }

  if (!/^\d+\.\d+\.\d+\.\d+$/.test(manifestVersion)) {
    throw new Error(`Expected EXT_MANIFEST_VERSION to be MAJOR.MINOR.PATCH.BUILD, got: ${manifestVersion}`)
  }

  const manifestJsonPath = new URL("../build/chrome-mv3-prod/manifest.json", `file://${__filename}`)
  const manifestJson = JSON.parse(await readFile(manifestJsonPath, "utf8"))

  manifestJson.version = manifestVersion
  manifestJson.version_name = manifestVersion

  await writeFile(manifestJsonPath, `${JSON.stringify(manifestJson)}\n`)
}
