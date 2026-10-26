#!/usr/bin/env python3
"""
build_common.py - rebuilds the SHARED HEADER and FOOTER on every page of the site.

WHY THIS EXISTS: the header (brand row + nav bar + mobile drawer) and the footer are
identical on all pages. They are baked into each .html file (the site is plain static
HTML, no framework). To change them you edit the templates below ONCE and run:

    python3 tools/build_common.py

Never hand-edit the header/footer inside an individual page: the next run of this tool
would overwrite your change. Everything else on a page is left untouched.
Safe to run any number of times (idempotent).
"""
import pathlib, re, sys

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"

HEADER_TEMPLATE = r'''<header class="site-header">
  <div class="header-top">
   <div class="header-top__inner">
    <a class="brand" href="index.html" aria-label="ISKCON JUJA home">
     <img class="brand-logo" src="images/juja-logo.svg" alt="ISKCON Juja">
     <span class="brand-text"><span class="brand-name">ISKCON JUJA</span></span>
    </a>
    <div class="header-mantra" aria-label="Maha Mantra">
     <p>Hare Krishna Hare Krishna Krishna Krishna Hare Hare</p>
     <p>Hare Rama Hare Rama Rama Rama Hare Hare</p>
    </div>
    <div class="prabhupada-block">
     <p class="prabhupada-caption">ISKCON Founder Acharya HDG Srila A.C Bhaktivedanta Swami Prabhupada</p>
     <img class="prabhupada-portrait" src="images/prabhupada-sitting.webp" alt="Srila Prabhupada" width="55" height="55">
    </div>
   </div>
  </div>
  <div class="nav-container">
   <label class="menu-button" for="menu-toggle" aria-label="Open menu"><span></span></label>
   <nav class="header-nav" aria-label="Main navigation" data-public-nav>
    <a href="index.html"@@A_index@@>Home</a>
    <a href="about.html"@@A_about@@>About Us</a>
    <a href="events.html"@@A_events@@>Events</a>
    <a href="merch.html"@@A_merch@@ data-show-if="store_enabled" hidden>Merchandise</a>
    <a class="@@CTA@@" href="participate.html">Get Involved</a>
    <a href="learn.html"@@A_learn@@>Learn</a>
   </nav>
   <nav class="header-nav member-quicknav" aria-label="Member navigation" data-member-nav hidden>
    <a href="dashboard.html"@@A_dashboard@@>Dashboard</a>
    <a href="my-courses.html"@@A_mycourses@@>My Courses</a>
   </nav>
   <div class="header-actions">
    <a class="profile-icon" href="devotees.html" title="Member Login" aria-label="Member Login" data-public-nav>
     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
    </a>
    <a href="admin.html" class="profile-icon" title="Admin Panel" aria-label="Admin Panel" data-admin-nav hidden style="font-size:16px;">&#128274;</a>
    <a href="#" class="sign-out-trigger" data-member-nav hidden style="font-weight:700;font-size:14px;">Sign Out</a>
    <button class="theme-switch-nav" type="button" data-theme-toggle aria-label="Toggle theme"></button>
   </div>
  </div>
  <input class="menu-toggle" type="checkbox" id="menu-toggle">
  <aside class="menu-drawer" id="mobile-nav-drawer" aria-label="Mobile navigation">
   <div class="drawer-head">
    <img class="drawer-logo" src="images/juja-logo.svg" alt="ISKCON Juja">
    <label class="drawer-close" for="menu-toggle" aria-label="Close menu">&times;</label>
   </div>
   <nav class="drawer-nav" data-public-nav>
    <a href="index.html">&#127968; Home</a>
    <a href="about.html">&#128725; About Our Community</a>
    <a href="events.html">&#128197; Weekly Programs &amp; Events</a>
    <a href="merch.html" data-show-if="store_enabled" hidden>&#128085; Merchandise</a>
    <a href="participate.html">&#129309; Get Involved / Volunteer</a>
    <a href="learn.html">&#128218; Learn</a>
    <a href="devotees.html">&#128274; Member Login</a>
   </nav>
   <nav class="drawer-nav" data-member-nav hidden>
    <a href="dashboard.html">&#128274; Member Dashboard</a>
    <a href="my-courses.html">&#128218; My Courses</a>
    <a href="#" class="sign-out-trigger">&#128682; Sign Out</a>
   </nav>
   <div class="drawer-footer" data-public-nav>
    <a class="button" href="#" data-whatsapp="Hi ISKCON JUJA! I would like to join the next program. Please send me the location and any details I need.">Join Our Next Program</a>
   </div>
  </aside>
  <label class="menu-scrim" for="menu-toggle" aria-label="Close menu"></label>
 </header>'''

FOOTER = r'''<footer class="footer">
   <div class="footer-grid">
    <div class="footer-brand">
     <img class="brand-logo" src="images/juja-logo.svg" alt="ISKCON Juja">
     <h2>ISKCON JUJA</h2>
    </div>
    <div>
     <h3>Related Links</h3>
     <a href="https://bbt.org/" target="_blank" rel="noopener">BBT</a>
     <a href="https://www.prabhupada.net/" target="_blank" rel="noopener">Srila Prabhupada</a>
     <a href="https://iskcon.org/" target="_blank" rel="noopener">ISKCON Official</a>
     <a href="https://vedabase.io/en/" target="_blank" rel="noopener">Vedabase</a>
    </div>
    <div>
     <h3>Contacts &amp; Map</h3>
     <address data-setting-text="address_short">Anthusia Apartments hse GH 3, Muraya Access road, Juja</address>
     <p>&#128222; <a data-contact-phone href="#">Call or WhatsApp us</a></p>
     <a class="map-link" data-map-link href="https://www.google.com/maps/search/?api=1&amp;query=Anthusia+Apartments+Muraya+Access+Road+Gachororo+Juja+Kenya" target="_blank" rel="noopener">&#128506;&#65039; Open in Google Maps</a>
    </div>
    <div>
     <h3>Socials</h3>
     <a href="#" data-setting-link="facebook_url" aria-label="Facebook" hidden>&#128218; Facebook</a>
     <a href="#" data-setting-link="instagram_url" aria-label="Instagram" hidden>&#128248; Instagram</a>
     <a href="#" data-setting-link="tiktok_url" aria-label="TikTok" hidden>&#127925; TikTok</a>
     <a href="#" data-setting-link="youtube_url" aria-label="YouTube" hidden>&#127916; YouTube</a>
     <a href="#" data-whatsapp="Hi ISKCON JUJA! I found you online and wanted to reach out.">&#128172; WhatsApp</a>
    </div>
   </div>
   <div class="footer-bottom">
    <p>&copy; <span data-year></span> ISKCON JUJA. All Rights Reserved. &middot; <a href="privacy.html" style="text-decoration:underline;">Privacy Policy</a></p>
   </div>
  </footer>'''


def header_for(page):
    """Return the header HTML with this page's nav link marked active."""
    on = lambda name: ' class="active"' if page == name else ""
    return (HEADER_TEMPLATE
            .replace("@@A_index@@", on("index.html"))
            .replace("@@A_about@@", on("about.html"))
            .replace("@@A_events@@", on("events.html"))
            .replace("@@A_merch@@", on("merch.html"))
            .replace("@@A_learn@@", on("learn.html"))
            .replace("@@A_dashboard@@", on("dashboard.html"))
            .replace("@@A_mycourses@@", on("my-courses.html"))
            .replace("@@CTA@@", "nav-cta active" if page == "participate.html" else "nav-cta"))


# ---- script tags: exactly one copy of each, in a fixed order -------------------------------
# History: an earlier build script appended a fresh copy of data.js on EVERY rebuild, so live pages
# loaded it 15+ times (each copy attached its own click handlers - e.g. the floating menu toggled
# itself open and shut). This function de-duplicates and puts the shared scripts in the right order:
#   supabase-config.js -> Supabase library -> data.js -> site.js -> everything page-specific.
SCRIPT_RE = re.compile(r'[ \t]*<script src="([^"]+)"([^>]*)></script>[ \t]*\n?')
SCRIPT_ORDER = ["supabase-config.js", "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", "data.js", "site.js"]


def normalize_scripts(s):
    found = list(SCRIPT_RE.finditer(s))
    if not found:
        return s
    keep, seen = [], set()
    for m in found:                      # keep the FIRST copy of each src
        if m.group(1) not in seen:
            seen.add(m.group(1))
            keep.append(m)
    pos = {id(m): i for i, m in enumerate(keep)}     # remember first-seen order BEFORE sorting
    rank = lambda m: (SCRIPT_ORDER.index(m.group(1)), 0) if m.group(1) in SCRIPT_ORDER else (len(SCRIPT_ORDER), pos[id(m)])
    keep.sort(key=rank)
    block = "".join('  <script src="%s"%s></script>\n' % (m.group(1), m.group(2)) for m in keep)
    first = found[0].start()
    for m in reversed(found):
        s = s[:m.start()] + s[m.end():]
    return s[:first] + block + s[first:]


def main():
    changed = 0
    for path in sorted(SITE.glob("*.html")):
        s = path.read_text(encoding="utf-8")
        if '<header class="site-header">' not in s:
            print("skip (no shared header):", path.name)
            continue
        new = re.sub(r'<header class="site-header">.*?</header>', lambda m: header_for(path.name), s, flags=re.S)
        new = re.sub(r'<footer class="footer">.*?</footer>', lambda m: FOOTER, new, flags=re.S)
        new = normalize_scripts(new)
        if new != s:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print("rebuilt:", path.name)
    print("done -", changed, "page(s) changed")


if __name__ == "__main__":
    main()
