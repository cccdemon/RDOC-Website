# RDOC Website Restyle Plan

## Goal

Restyle the RDOC website so it visually matches the Streamertools Source Code style, while keeping the existing website structure and content mostly intact.

Also add a navigation point for:

```text
https://financial.raumdock.org/
```

## Scope

Files expected to change:

- `index.html`
- `assets/styles.css`
- possibly `datenschutz.html`
- possibly `404.html`

The separate `starcom/` subsite is not part of the first pass unless explicitly included later.

## Implementation Steps

1. Audit the existing website shell
   - Review current desktop navigation.
   - Review current mobile drawer navigation.
   - Check shared layout patterns used by `index.html`, `datenschutz.html`, and `404.html`.

2. Add the financial navigation point
   - Add a nav item for `financial.raumdock.org`.
   - Add it to the desktop navigation.
   - Add it to the mobile drawer navigation.
   - Use a clear label such as `Financial` or `Finanzen`.
   - Treat it as an external/subdomain link and keep link behavior consistent with the rest of the site.

3. Fix small HTML issues while editing
   - Repair the malformed OpenGraph description meta tag in `index.html`.
   - Fix the Discord link typo from `discordgg/raumdock` to `discord.gg/raumdock`.
   - Ensure external links using a new tab also include `rel="noopener"`.

4. Restyle the main website
   - Use the Streamertools style as the visual reference:
     - near-black backgrounds
     - cyan borders and accents
     - gold highlights
     - technical mono headings
     - compact panel/card UI
     - subtle scanline/terminal-like atmosphere
   - Import or use fonts similar to Streamertools:
     - `Share Tech Mono`
     - `Rajdhani`

5. Update major UI areas
   - Header and navigation
   - Hero section
   - Buttons and call-to-action links
   - Cards and content panels
   - Link list
   - Twitch embed frame
   - Footer
   - Mobile drawer and burger button

6. Keep the current RDOC visual identity
   - Keep `assets/wolf.png` as the main hero asset.
   - Adjust overlay, contrast, and positioning so the image fits the new Streamertools-inspired technical style.

7. Apply consistency where needed
   - Bring `datenschutz.html` and `404.html` into the same visual system if they use the public website shell.
   - Avoid unrelated content changes.

8. Validate
   - Check desktop layout.
   - Check mobile layout.
   - Verify the financial nav link.
   - Verify the Twitch embed still uses the correct parent domain.
   - Confirm there is no build step required because the site is static HTML/CSS/JS.

## Notes

- This is a restyle, not a full redesign.
- The first pass should stay focused on the public RDOC website.
- The `starcom/` subsite can be restyled separately if needed.
