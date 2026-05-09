"""Verify the click-popup overlay appears when a region is selected."""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5173/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1700, "height": 1100})
    page = context.new_page()
    errs: list[str] = []
    page.on("pageerror", lambda exc: errs.append(f"PAGEERROR: {exc}"))
    page.on("console", lambda msg: msg.type == "error" and errs.append(f"CONSOLE: {msg.text}"))

    page.goto(URL, wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(5500)

    # Click on a state path on the map. We need to identify a TN polygon.
    # Hit the ranking list — scroll to find Tamil Nadu, click it.
    # First, expand the ranking list by clicking "All".
    try:
        page.locator("button:has-text('All')").first.click(timeout=2000)
        page.wait_for_timeout(800)
    except Exception:
        pass
    btn = page.locator("button:has-text('Tamil Nadu')").first
    if btn.count() > 0:
        btn.click()
        page.wait_for_timeout(1500)
    page.screenshot(path="/tmp/iccc_popup.png", full_page=True)
    print("popup screenshot: /tmp/iccc_popup.png")
    if errs:
        print("\n--- runtime issues ---")
        for e in errs: print(e)
    else:
        print("no console errors")
    browser.close()
