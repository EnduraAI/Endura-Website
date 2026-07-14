# Endura Decommissioning Website V34 Final - GitHub Pages Edition

## Approved deployment target
This package is prepared for GitHub Pages with the custom domain `enduradecom.com`.

## Publish from the repository root
The selected GitHub Pages publishing source must contain `index.html` at its top level. The package includes:
- `CNAME` with `enduradecom.com`;
- `.nojekyll` so GitHub Pages serves the static package without Jekyll processing;
- the complete V34 website and three restored interactive public tools.

## Contact form
The public contact form posts to Formspree endpoint `https://formspree.io/f/mnjkwryq`.
- Form id: `contactForm`.
- Formspree honeypot: `_gotcha`.
- Intended success page: `https://enduradecom.com/thanks.html`.
- The form includes `_next` as requested and JavaScript progressive enhancement that redirects to the same success page after a confirmed JSON response.
- If JavaScript is unavailable, the browser submits the form directly to Formspree.

Formspree currently also supports setting the final redirect in the Formspree dashboard. Configure the endpoint redirect to `https://enduradecom.com/thanks.html` before launch so the native no-JavaScript path has the same destination.

## Restored interactive pages
- `diagnostic.html`: eight-question browser-only Rapid Liability Self-Check.
- `explorer.html`: interactive illustrative offshore/onshore asset-domain explorer.
- `checklist.html`: 12-point ARO Defensibility Checklist with Formspree resource request and in-browser checklist state.

These pages use the V34 theme, navigation, typography, colours, responsive system and entity controls. All model outputs and figures are labelled illustrative.

## Capability statement legal identity
The packaged PDF is byte-for-byte identical to the supplied `ED_Capability Statement 2026.pdf`.
Verified wording on page 13:
`Van Iersel Projects Pty Ltd t/a Endura Decommissioning · ACN 652 513 605`.
No ABN has been added or guessed.

## GitHub Pages limitation
GitHub Pages does not apply the Netlify-style `_headers` file. It is retained only as a reference for a future host or reverse proxy and has been updated to allow Formspree. Security headers must be applied through the actual delivery layer if required.

## Launch checks
1. Configure the repository custom domain as `enduradecom.com` in Settings > Pages.
2. Confirm HTTPS enforcement after DNS verification.
3. Activate and verify the Formspree endpoint.
4. Configure the Formspree thank-you redirect to `https://enduradecom.com/thanks.html`.
5. Submit one real contact-form test and one checklist unlock test from the live domain.
6. Review every page on physical iPhone Safari and Android Chrome.
7. Confirm social previews after the final domain is live.

## Legal identity
Van Iersel Projects Pty Ltd t/a Endura Decommissioning, ACN 652 513 605.

## Packaged verification
- 502 automated static checks passed, with 0 failures.
- Browser interaction checks passed for the diagnostic, explorer, checklist and Formspree contact-form structure.
- 40 responsive page-and-viewport checks passed, with 0 horizontal-overflow failures.
- The packaged capability statement is byte-for-byte identical to the supplied PDF.
- Detailed evidence is in `reports/Release-Verification.json`, `reports/GitHub-Pages-QA.json`, `reports/Browser-QA.json` and `reports/Responsive-QA.json`.

This confirms zero known errors in the packaged static files. Formspree delivery, GitHub custom-domain behaviour, HTTPS, physical devices and live social previews still require the launch checks above.
