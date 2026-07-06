export async function openUrl(url: string): Promise<void> {
  if (!globalThis.chrome?.tabs?.create) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  await chrome.tabs.create({ url })
}
