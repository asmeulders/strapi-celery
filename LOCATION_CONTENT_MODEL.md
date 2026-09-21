# Task: extend the `location` content type for state and city pages

This is a one-off task brief for Claude Code working in this repo (Strapi 5). Read it fully, then do the steps in order. Do not push or open a PR; leave changes uncommitted (or committed locally if asked) for the user to review.

## Context

The Next.js site (`/home/asmeulders/Projects/celery-fork/celery`, branch `new-location-pages`) renders two new page types from Strapi:

- **State pages** (e.g. `/nh`): hero, trust bar, and a searchable directory of every county and town in the state.
- **City pages** (e.g. `/nh/rockingham/portsmouth`): local answer block and intro, offer math table, market stats, "houses we bought", neighborhoods/ZIPs, testimonials, map, nearby towns, and 10 FAQs.

The `location` collection type here currently has only: `name`, `slug`, `locationType`, `parent`/`children`, `latitude`, `longitude`, `metaTitle`, `metaDescription`, `contentBlocks`. The site needs more fields. The site-side contract is `/home/asmeulders/Projects/celery-fork/celery/docs/strapi-location-schema.md` and `src/lib/cms.ts` / `src/types/location.ts` in that repo. If this file and those disagree, the site code wins; tell the user.

## Ground rules

- Only touch the `location` API and add a new `src/components/location/` folder. Do **not** modify `blog-post`, `author`, or `src/components/blog/`.
- **Keep `src/api/location/content-types/location/lifecycles.js` as is** (per-parent slug uniqueness; it has fragile double-invocation handling). New fields must not change its behavior. Remove nothing already in the schema, including `contentBlocks` (legacy, now unused by the site).
- Keep `draftAndPublish: true`. Field names are camelCase and must match exactly; the site reads them by name.
- New scalar fields must be nullable (no `required`) except where stated. Existing location rows will have `null` for the new fields; the site already treats `null` `hasPage` as `true`.
- Don't hand-edit anything under `types/generated/`. Let `npm run develop` regenerate it, and include the regenerated files in the change if that folder is tracked.

## Step 1: add components (`src/components/location/`)

Create these files. UIDs are `location.<file-name>`.

`string-item.json`
```json
{
  "collectionName": "components_location_string_items",
  "info": { "displayName": "String Item", "icon": "bulletList" },
  "options": {},
  "attributes": {
    "text": { "type": "string", "required": true }
  }
}
```

`market.json`
```json
{
  "collectionName": "components_location_markets",
  "info": { "displayName": "Market", "icon": "chartBubble" },
  "options": {},
  "attributes": {
    "medianPrice": { "type": "string" },
    "avgDom": { "type": "string" },
    "avgCommission": { "type": "string" },
    "inventoryTrend": { "type": "text" },
    "asOf": { "type": "string" },
    "source": { "type": "string" }
  }
}
```

`offer-math.json`
```json
{
  "collectionName": "components_location_offer_maths",
  "info": { "displayName": "Offer Math", "icon": "calculator" },
  "options": {},
  "attributes": {
    "cashOffer": { "type": "string" },
    "listPrice": { "type": "string" },
    "tradTime": { "type": "string" },
    "commissionAmt": { "type": "string" },
    "closingAmt": { "type": "string" },
    "negotiationAmt": { "type": "string" },
    "holdingAmt": { "type": "string" },
    "tradNet": { "type": "string" }
  }
}
```

`deal.json`
```json
{
  "collectionName": "components_location_deals",
  "info": { "displayName": "Deal", "icon": "house" },
  "options": {},
  "attributes": {
    "street": { "type": "string", "required": true },
    "hood": { "type": "string" },
    "zip": { "type": "string" },
    "condition": { "type": "string" },
    "days": { "type": "string" },
    "situation": { "type": "string" },
    "image": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "imageAlt": { "type": "string" }
  }
}
```

`recent-seller.json`
```json
{
  "collectionName": "components_location_recent_sellers",
  "info": { "displayName": "Recent Seller", "icon": "user" },
  "options": {},
  "attributes": {
    "firstName": { "type": "string", "required": true },
    "street": { "type": "string", "required": true },
    "zip": { "type": "string" },
    "closedDate": { "type": "string" }
  }
}
```

`testimonial.json`
```json
{
  "collectionName": "components_location_testimonials",
  "info": { "displayName": "Testimonial", "icon": "quote" },
  "options": {},
  "attributes": {
    "quote": { "type": "text", "required": true },
    "name": { "type": "string", "required": true },
    "hood": { "type": "string" }
  }
}
```

`faq.json`
```json
{
  "collectionName": "components_location_faqs",
  "info": { "displayName": "Location FAQ", "icon": "question" },
  "options": {},
  "attributes": {
    "question": { "type": "string" },
    "answer": { "type": "text", "required": true }
  }
}
```

`question` is intentionally **not** required: the site has ten fixed question templates matched to FAQ items by position, and `question` only overrides them.

## Step 2: add attributes to `location` schema

Merge these into `attributes` of `src/api/location/content-types/location/schema.json` (keep all existing attributes):

```json
"hasPage": { "type": "boolean", "default": true },
"sortOrder": { "type": "integer" },
"ogImage": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
"heroImage": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
"heroImageAlt": { "type": "string" },

"homesBought": { "type": "string" },
"totalPaid": { "type": "string" },
"population": { "type": "string" },

"topMarkets": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::location.location"
},

"regionName": { "type": "string" },
"driveTime": { "type": "string" },
"mapEmbedSrc": { "type": "text" },
"answerBlock": { "type": "text" },
"localIntro": { "type": "blocks" },
"ownerOrigin": { "type": "text" },
"zips": { "type": "component", "repeatable": true, "component": "location.string-item" },
"neighborhoods": { "type": "component", "repeatable": true, "component": "location.string-item" },
"landmarks": { "type": "component", "repeatable": true, "component": "location.string-item" },
"nearbyTowns": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::location.location"
},
"market": { "type": "component", "repeatable": false, "component": "location.market" },
"offerMath": { "type": "component", "repeatable": false, "component": "location.offer-math" },
"deals": { "type": "component", "repeatable": true, "component": "location.deal" },
"recentSellers": { "type": "component", "repeatable": true, "component": "location.recent-seller" },
"testimonials": { "type": "component", "repeatable": true, "component": "location.testimonial" },
"faqs": { "type": "component", "repeatable": true, "component": "location.faq" }
```

Notes:
- `topMarkets` and `nearbyTowns` are deliberately **one-way** relations (no `inversedBy`/`mappedBy`), both pointing back at `location`. Their order in the admin UI is the display order on the site; do not add sorting.
- Field meanings: `hasPage` false = listed on the state directory as plain text with no route (only meaningful for cities); `sortOrder` orders counties on the state page; `homesBought`/`totalPaid`/`population` are scoped stats on **state and county** records; `topMarkets` is state-only (up to 4 cities); everything from `regionName` down is city-only.
- Optionally group these in the admin (Content-Type Builder / edit view layout) so state-only and city-only fields are easy to tell apart. Not required.

## Step 3: run and verify locally

1. `npm run develop`. Confirm it starts with no schema errors and that the Location entry form shows all the new fields. (Admin URL is normally http://localhost:1337/admin.)
2. Check `config/api.js`: `maxLimit` is 100 and the site requests `pageSize=100`, so leave it alone.
3. Create an **API token** for the site if there isn't one: Settings > API Tokens, type Read-only, and put it in the site's `.env` as `CMS_API_TOKEN`. Also create a **Full access** (or custom create/update on Location) token for the seed scripts, used as `STRAPI_MIGRATION_TOKEN`. Never commit tokens.
4. Verify the two requests the site makes (replace `$T` with the read-only token; publish at least one location first, drafts are not returned):

   Tree (paginated, light fields):
   ```
   curl -s -H "Authorization: Bearer $T" "http://localhost:1337/api/locations?fields[0]=name&fields[1]=slug&fields[2]=locationType&fields[3]=latitude&fields[4]=longitude&fields[5]=hasPage&fields[6]=sortOrder&fields[7]=metaTitle&fields[8]=metaDescription&populate[parent][fields][0]=id&pagination[page]=1&pagination[pageSize]=100&sort[0]=locationType:asc&sort[1]=name:asc&sort[2]=id:asc"
   ```
   Expect `data[]` with `documentId`, `hasPage` (may be `null` for old rows), `parent.id`, and `meta.pagination.pageCount`.

   Content (one location; use a real `documentId`):
   ```
   curl -s -H "Authorization: Bearer $T" "http://localhost:1337/api/locations/<documentId>?populate[parent][fields][0]=id&populate[ogImage]=true&populate[heroImage]=true&populate[topMarkets][fields][0]=id&populate[nearbyTowns][fields][0]=id&populate[zips]=true&populate[neighborhoods]=true&populate[landmarks]=true&populate[market]=true&populate[offerMath]=true&populate[deals][populate][image]=true&populate[recentSellers]=true&populate[testimonials]=true&populate[faqs]=true"
   ```
   Expect a 200 with all populated fields present (empty arrays / `null` when unset). Any 400 "Invalid key" means a field name or component UID doesn't match this brief.
5. Confirm the slug lifecycle still works: creating two locations with the same slug under the same parent must fail; the same slug under different parents (York County vs York city) must succeed.

## Step 4: load data (scripts live in the site repo)

Run from `/home/asmeulders/Projects/celery-fork/celery`, with `CMS_API_URL=http://localhost:1337` and `STRAPI_MIGRATION_TOKEN` in that repo's `.env`.

1. If the local Strapi has no locations yet: `node scripts/migrate-locations-to-strapi.mjs` (copies the MySQL `locations` table; needs the `DB_*` vars in that `.env`). If it already has the tree, skip.
2. `node scripts/seed-state-directory.mjs`: loads New Hampshire's 8 counties and 171 towns, setting county `sortOrder` and town `hasPage` (55 towns have pages). It's idempotent.
3. Check in the admin that the seed results are **published**, not left as drafts (the site only sees published entries). The script updates existing entries with `PUT`; if updated entries stay draft-only, tell the user and propose the fix in `seed-state-directory.mjs` (e.g. publish after update); do not silently change the site repo.
4. Fill in one city end to end (Portsmouth is a good candidate) with every city-only field, plus one county's and the state's `homesBought`/`totalPaid`/`population`, and `topMarkets` on New Hampshire. Then check the site with `npm run dev` in the site repo (`CMS_API_URL` pointing at local Strapi): `/nh` and `/nh/rockingham/portsmouth` should render.

## Step 5: production notes (tell the user, don't do)

- Schema changes ship by pushing this repo (the Railway deploy picks up the new `schema.json` and components). **Content does not**: the seed scripts (or content entry) must be run against the production Strapi separately, with a production full-access token.
- In production Strapi, add a webhook (Settings > Webhooks) for Location create/update/publish/unpublish/delete pointing at `https://<site>/api/cms/revalidate` with header `Authorization: Bearer <CMS_WEBHOOK_SECRET>`. Without it, pages update at the site's hourly revalidate.
- The site's production build fails hard if Strapi is unreachable or the read-only token lacks `find`/`findOne` on Location. Confirm the token before the site deploys.

## Definition of done

- Seven new component files and the extended `location` schema, and nothing else changed except regenerated `types/generated/*` (if tracked).
- `npm run develop` boots cleanly; both curl requests above return 200 with the expected shape; the slug-uniqueness behavior is unchanged.
- A short summary for the user: files changed, anything that disagreed with the site code, and whether seeded entries came out published.
