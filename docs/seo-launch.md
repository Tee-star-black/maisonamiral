# Maison Amiral SEO launch and verification

## Implemented in the repository

- Distinct route titles and descriptions.
- Page-specific canonical URLs (preferred host: https://www.maisonamiral.co.za).
- Home page Organization + WebSite JSON-LD and individual Product + Offer JSON-LD for each item with real ZAR prices.
- Brand wheel favicon (SVG + 32x32 ICO), 180x180 Apple touch PNG, Next.js app icon metadata, web app manifest and a 1200x630 branded Open Graph image.
- Open Graph and X/Twitter site previews.
- Generated /sitemap.xml with the shop, products and published information pages.
- /robots.txt with sitemap and crawl exclusions for private cart, checkout and API paths.
- Noindex on checkout, cart and newsletter confirmation/unsubscribe experiences.
- Human-readable product image alt text and real photo gallery.
- Responsive product catalogue and mobile layouts.

## Required production tasks before SEO is marked complete

1. **Canonical hostname**: configure permanent 301 redirects from http:// and from maisonamiral.co.za to https://www.maisonamiral.co.za (or agree to switch canonicals to whichever host is actually production).
2. **Verify production output**: inspect `/robots.txt`, `/sitemap.xml`, `/icon.svg`, `/manifest.webmanifest` and `/opengraph-image`; check HTTP 200 and correct content types.
3. **Google Search Console**: verify domain/DNS ownership, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` only if verifying via HTML tag, submit `https://www.maisonamiral.co.za/sitemap.xml`, and request indexing of key products.
4. **Bing Webmaster Tools**: verify and submit the same sitemap.
5. **Redirect audit**: obtain a crawl/export of old-site URLs, map each to the most relevant working new page, add 301 redirects. Do not create blanket redirects for unknown or unrelated URLs.
6. **Old SEO comparison**: retrieve the old site HTML, pre-migration backup or Search Console export to compare original titles, descriptions, canonical rules, robots, sitemap, social markup and referral links. The old public domain could not be fetched during this implementation; historical tags were not guessed.
7. **Rich results**: use Schema Markup Validator / Google's Rich Results Test on product pages. Availability, shipping times and review scores must not be added unless verified.
8. **Core Web Vitals**: test mobile LCP, CLS, INP and image loading with PageSpeed Insights, real-user data when possible, on the deployed domain. The unused Garment Studio was removed from the homepage to reduce client-side 3D work.
9. **Social sharing**: test Facebook Sharing Debugger and LinkedIn Post Inspector after the deployment, especially cached old social images.
10. **Performance and accessibility**: run `npm ci && npm run lint && npm run build`, then inspect mobile widths 320, 360, 390, 430, 768 and 1024 pixels, keyboard navigation and email signup.
11. **Apple home-screen icon**: a wheel PNG at 180x180 is included; inspect on a physical iPhone to confirm home-screen appearance.
12. **Store listings**: ensure pricing, availability and product photos are consistent with the actual checkout and inventory. If using Google Merchant Center, configure product feeds separately.

## Useful production checks

```powershell
npm ci
npm run lint
npm run build
Invoke-WebRequest https://www.maisonamiral.co.za/robots.txt
Invoke-WebRequest https://www.maisonamiral.co.za/sitemap.xml
Invoke-WebRequest https://www.maisonamiral.co.za/icon.svg
Invoke-WebRequest https://www.maisonamiral.co.za/opengraph-image
```

SEO implementation does not guarantee rankings or indexing. Search engines must recrawl the deployed production pages.
