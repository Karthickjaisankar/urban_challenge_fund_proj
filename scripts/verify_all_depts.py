"""Verify all 6 department tabs render without errors and capture a screenshot of each."""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5173/"
DEPTS = ["Health", "Education", "Women & Child", "Revenue", "Disaster Mgmt", "Tourism"]

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1700, "height": 1100})
    page = context.new_page()
    errs: list[str] = []
    page.on("pageerror", lambda exc: errs.append(f"PAGEERROR: {exc}"))
    page.on("console", lambda msg: msg.type == "error" and errs.append(f"CONSOLE: {msg.text}"))

    page.goto(URL, wait_until="domcontentloaded", timeout=20000)
    page.wait_for_timeout(5000)

    for dept in DEPTS:
        try:
            page.locator(f"button:has-text('{dept}')").first.click(timeout=4000)
            page.wait_for_timeout(2500)
            slug = dept.lower().replace(" & ", "_").replace(" ", "_")
            path = f"/tmp/iccc_{slug}.png"
            page.screenshot(path=path, full_page=True)
            print(f"  {dept}: {path}")
        except Exception as e:
            print(f"  {dept}: FAILED — {e}")

    if errs:
        print("\n--- runtime issues ---")
        for e in errs[:20]:
            print(e)
    else:
        print("\nNo console errors across all 6 departments.")
    browser.close()
