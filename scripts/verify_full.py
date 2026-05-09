"""End-to-end verification: India view → click TN via real mouse → district view screenshot."""
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
    page.wait_for_timeout(4500)
    page.screenshot(path="/tmp/iccc_india.png", full_page=True)
    print("india view: /tmp/iccc_india.png")

    # Click Tamil Nadu via the ranking list (more reliable than map coordinates).
    # Look for a button containing "Tamil Nadu" inside the ranking list.
    try:
        page.get_by_role("button", name="#").nth(0)  # not robust
    except Exception:
        pass
    btn = page.locator("button:has-text('Tamil Nadu')").first
    if btn.count() > 0:
        btn.click()
        page.wait_for_timeout(3500)
        page.screenshot(path="/tmp/iccc_tn.png", full_page=True)
        print("TN district view: /tmp/iccc_tn.png")
    else:
        print("could not find 'Tamil Nadu' button in DOM")

    if errs:
        print("\n--- runtime issues ---")
        for e in errs:
            print(e)
    else:
        print("no console errors")
    browser.close()
