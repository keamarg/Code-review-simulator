export async function warmLayoutAssets(): Promise<void> {
  try {
    const fonts: any = (document as any).fonts;
    const loads: Promise<any>[] = [];

    if (fonts && typeof fonts.load === "function") {
      // Load Space Mono weights used in UI
      loads.push(fonts.load('400 14px "Space Mono"'));
      loads.push(fonts.load('700 14px "Space Mono"'));
      // JetBrains Mono is the app base font
      loads.push(fonts.load('400 14px "JetBrains Mono"'));
      loads.push(fonts.load('700 14px "JetBrains Mono"'));
      if (fonts.ready && typeof fonts.ready.then === "function") {
        loads.push(fonts.ready);
      }
    }

    // Create hidden ligature probes to force glyph rasterization
    // Create hidden spans to warm font fallback path; no icon font needed anymore
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;opacity:0;pointer-events:none;left:-9999px;top:-9999px;font-family:Space Mono, 'JetBrains Mono', monospace;";
    probe.textContent = "Warmup";
    document.body.appendChild(probe);

    // Race with a short timeout so we don't block UI if the API is unavailable
    const timeout = new Promise((resolve) => setTimeout(resolve, 400));
    await Promise.race([Promise.all(loads), timeout]);

    try {
      document.body.removeChild(probe);
    } catch {}
  } catch {
    // Best effort; ignore failures
  }
}
