# Endura Decommissioning — Website

Your complete website, four pages, ready to go live. No coding needed to use it.

## What's in the folder

- `index.html` — Home
- `decomm-ai.html` — decomm.ai (the platform)
- `services.html` — Services
- `contact.html` — Contact (with the request-a-pilot form)
- `styles.css` — the shared design (don't need to touch)
- `site.js` — the interactions (don't need to touch)
- four `.svg` files — the logo ring, gauge and diagram (don't need to touch)

Keep all of these together in one folder. They reference each other.

## ONE thing you must do before the form works

The contact form needs a free service called Formspree to email you submissions.

1. Go to **https://formspree.io** and sign up (free plan is fine).
2. Click **New Form**, give it a name like "Endura pilot requests", and use **jed@enduradecom.com** as the email it sends to.
3. Formspree gives you an endpoint that looks like `https://formspree.io/f/abcdwxyz`.
4. Open `contact.html` in any text editor (even Notepad). Find the line that says:
   `action="https://formspree.io/f/YOUR_FORM_ID"`
5. Replace `YOUR_FORM_ID` with your real ID (the part after `/f/`). Save.

That's it — the form will now email Jed every time someone submits.
(Until you do this step, the form looks fine but won't actually send.)

## Getting it live on enduradecom.com

Your domain is currently with Squarespace. You have two easy options:

### Option A — Netlify (recommended, free, 10 minutes)
1. Go to **https://app.netlify.com** and sign up.
2. On the dashboard, drag this whole folder onto the area that says "drag and drop your site folder here". It goes live instantly on a temporary netlify address.
3. To use enduradecom.com: in Netlify go to **Domain settings → Add a domain**, type `enduradecom.com`, and Netlify shows you the DNS records to set.
4. In Squarespace, go to your domain's DNS settings and point it to Netlify using those records (Netlify gives step-by-step instructions for this exact case). Allow a few hours for it to take effect.

### Option B — Keep it simple inside Squarespace
If you'd rather not move hosting, you can keep Squarespace but you'd need to rebuild these pages in their editor — the custom design won't carry over. Option A keeps the design exactly as built.

## To preview it right now on your computer
Just double-click `index.html` — it opens in your browser and works fully (except the form, until you've done the Formspree step).

## Changing text later
All the words live inside the `.html` files. Open any one in a text editor, change the text between the tags, save. The design stays intact.

## A note on positioning
This site is built **neutral** — offshore and onshore, with decomm.ai as the hero — so it works for every visitor. Your targeted offshore capability statement stays separate, for direct pitches.

---
Van Iersel Projects Pty Ltd t/a Endura Decommissioning · ACN 652 513 605

---

## NEW in this version (the "futuristic" upgrade)

Extra files now included — keep them all in the folder:
- `enhance.css` / `enhance.js` — the motion, glow, interactivity and the live demo
- `favicon.svg` — the little Endura ring that shows in the browser tab
- `og-image.png` — the preview card shown when the site link is shared on LinkedIn/email/WhatsApp
- `site.webmanifest` — lets the site behave like an app if saved to a phone home screen
- `404.html` — the friendly "page not found" screen
- `robots.txt` + `sitemap.xml` — help Google find and index the site

What's new for visitors:
- The hero now has a live "sonar sweep" that gently reacts to the mouse.
- On the decomm.ai page there's an **interactive demo** — drag the documentation-quality sliders and the ARO range compresses live. This is the standout feature.
- A thin amber progress bar at the very top tracks scroll position.
- Numbers count up, the funnel draws itself, cards glow on hover.

### One extra hosting note (Netlify + the 404 page)
Netlify automatically uses `404.html` as the not-found page — nothing to configure. If you ever host somewhere else, just make sure that host is told to serve `404.html` for missing pages.

### The Open Graph preview
`og-image.png` is referenced with the full address `https://enduradecom.com/og-image.png`. It will only show in link previews once the site is actually live at that domain. Nothing to do — it just starts working after go-live.

---

## 10X UPGRADE — two interactive tools added

**New pages:**
- `explorer.html` — a real, rotatable 3D asset explorer. Toggle between an offshore platform and an onshore gas plant; click any of the nine domains and that part of the structure lights up, showing where the documentation gap physically sits. Uses `three.min.js` (now included in the folder — keep it there).
- `diagnostic.html` — a genuine 2-minute "Rapid Liability Self-Check". Eight questions; produces a real, answer-driven integrity score, an estimate-confidence range, and flagged gaps. Runs entirely in the visitor's browser — nothing is sent or stored. Visitors can print/save the result.

**New files to keep in the folder:** `explorer.html`, `explorer.js`, `diagnostic.html`, `diagnostic.js`, `three.min.js`.

Both tools are linked from the decomm.ai page. They're clearly labelled "illustrative" and state that they don't compute the accounting ARO number — protecting Endura while still being genuinely useful.

**Performance note:** `three.min.js` is ~590KB; it only loads on the explorer page, so the rest of the site stays fast. This is normal for 3D.

---

## BENCHMARK BUILD — what's new in this version

**Reliability fix:** the 3D explorer now loads its 3D engine from four fallback sources (local file first, then three CDNs) and shows a clear message if all fail — so it can never silently show nothing again. If you open it from inside the unzipped folder, it uses the bundled `three.min.js` and works offline.

**New page:** `checklist.html` — a gated "ARO Defensibility Checklist" lead magnet. A visitor enters name/email/company and the full 12-point checklist unlocks instantly on the page (and is printable). It posts to Formspree in the background when configured — same `YOUR_FORM_ID` swap as the contact form. It unlocks immediately either way, so a visitor is never blocked.

**Wow layer (site-wide):**
- Magnetic buttons (the primary buttons gently follow the cursor).
- The nav gains a subtle shadow once you scroll.
- The 3D explorer now plays an "assemble" intro (parts rise into place) and supports touch pinch-zoom on mobile.

**Files now in the folder:** add `checklist.html` to the keep-together list alongside the others.

### Still to come (needs you)
The one remaining "10X" item — a real anonymised **case study** — needs your West Coast study content. Paste or upload it and it becomes a polished proof page. This is the single highest-value addition left, because it's the proof senior buyers ask for.
