"""Verify clicking Tamil Nadu drills into the district view."""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5173/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1600, "height": 1000})
    page = context.new_page()
    errs: list[str] = []
    page.on("pageerror", lambda exc: errs.append(f"PAGEERROR: {exc}"))
    page.on("console", lambda msg: msg.type == "error" and errs.append(f"CONSOLE: {msg.text}"))
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_timeout(4500)

    # Find the SVG path for Tamil Nadu via Leaflet's tooltip system: hover all paths, find one with TN tooltip.
    # Easier: directly find the path whose tooltip contains "Tamil Nadu" — Leaflet binds tooltips into DOM lazily.
    # Trick: simulate click in the center of the TN region by JS coords. Or: query layer by feature.
    # Simplest: programmatically dispatch the React state via the App's onSelect — by injecting a click on the path with the matching aria-label/title.
    # Leaflet sets path titles via tooltip; let's try clicking on the path under text "Tamil Nadu" location.

    # Click TN by using its centroid in CSS pixels — TN is around lat 11.0, lon 78.5.
    # Convert via map projection: easier — call Leaflet from JS.
    page.evaluate("""
      () => {
        const map = window.__leafletMap || (() => {
          const c = document.querySelector('.leaflet-container');
          // react-leaflet attaches via _leaflet_id; we need another way. Use leaflet's hidden registry:
          for (const k of Object.keys(c)) {
            if (k.startsWith('__reactProps')) {
              // not the map directly
            }
          }
          return null;
        })();
      }
    """)

    # Direct DOM approach: TN path will have `<title>Tamil Nadu</title>` after hover, but tooltips appear on hover.
    # Use the layer's name in path attribute we don't have. Let's hack it: trigger hover events on each path until tooltip says TN.
    found = page.evaluate("""
      () => {
        const paths = Array.from(document.querySelectorAll('.leaflet-overlay-pane svg path'));
        return paths.length;
      }
    """)
    print(f"paths in svg: {found}")

    # Hover each path until the leaflet tooltip says "Tamil Nadu", then click that path.
    clicked = page.evaluate("""
      async () => {
        const paths = Array.from(document.querySelectorAll('.leaflet-overlay-pane svg path'));
        for (const p of paths) {
          p.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          await new Promise(r => setTimeout(r, 30));
          const tip = document.querySelector('.leaflet-tooltip');
          if (tip && tip.textContent && tip.textContent.trim() === 'Tamil Nadu') {
            p.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
          }
          p.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        }
        return false;
      }
    """)
    print(f"TN path clicked: {clicked}")
    page.wait_for_timeout(2500)
    page.screenshot(path="/tmp/iccc_drilldown.png", full_page=True)
    print("drilldown screenshot saved: /tmp/iccc_drilldown.png")
    if errs:
        print("\n--- runtime issues ---")
        for e in errs:
            print(e)
    browser.close()
