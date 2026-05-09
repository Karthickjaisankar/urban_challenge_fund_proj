"""Headless smoke check: load the dashboard, capture console, take a screenshot."""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5173/"
OUT = "/tmp/iccc_screenshot.png"

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1600, "height": 1000})
    page = context.new_page()
    errs: list[str] = []
    page.on("pageerror", lambda exc: errs.append(f"PAGEERROR: {exc}"))
    page.on("console", lambda msg: (
        msg.type in ("error", "warning") and errs.append(f"{msg.type.upper()}: {msg.text}")
    ))
    page.goto(URL, wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(5000)  # let the SSE first tick land
    page.screenshot(path=OUT, full_page=True)
    print(f"screenshot saved: {OUT}")
    if errs:
        print("\n--- runtime issues ---")
        for e in errs:
            print(e)
    else:
        print("no console errors")
    browser.close()
