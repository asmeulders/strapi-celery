/**
 * Migrates `blog-post.category` from a fixed `enumeration` field to a relation
 * against the new `api::category.category` content-type.
 *
 * This MUST run in two separate passes, straddling the schema change, because
 * once `blog-post`'s schema.json declares `category` as a relation, Strapi's
 * startup schema sync drops the old enum column — so the enum string values
 * have to be captured to disk *before* that happens, then replayed *after*.
 *
 * Pass 1 — run with the OLD schema still in place (category: enumeration):
 *   railway run node scripts/migrate-category-enum-to-relation.js export --dry-run   # preview
 *   railway run node scripts/migrate-category-enum-to-relation.js export             # writes map
 *
 *   This seeds the four `category` entries (idempotent, matched by `name`) and writes
 *   every blog-post's current { documentId, status, category } to
 *   scripts/category-migration-map.json.
 *
 * --- swap blog-post.schema.json's `category` field to the relation shape here, reboot ---
 *
 * Pass 2 — run with the NEW schema in place (category: relation):
 *   railway run node scripts/migrate-category-enum-to-relation.js apply --dry-run    # preview
 *   railway run node scripts/migrate-category-enum-to-relation.js apply             # relinks
 *
 *   Reads the map written by `export` and sets each blog-post document's `category`
 *   relation to the matching category's id, once per recorded status (draft/published),
 *   so posts with unpublished draft edits get both versions relinked.
 */
const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const POST_UID = 'api::blog-post.blog-post';
const CATEGORY_UID = 'api::category.category';
const MAP_PATH = path.join(__dirname, 'category-migration-map.json');

const CATEGORY_NAMES = ['Selling Tips', 'Market News', 'Legal & Process', 'Investor Insights'];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const mode = args.find((a) => !a.startsWith('--'));

async function exportPass(app) {
  for (const name of CATEGORY_NAMES) {
    const existing = await app.documents(CATEGORY_UID).findFirst({ filters: { name } });
    if (existing) {
      console.log(`category "${name}": already exists (documentId=${existing.documentId})`);
      continue;
    }
    console.log(`category "${name}": ${DRY_RUN ? 'would create' : 'creating'}`);
    if (!DRY_RUN) {
      await app.documents(CATEGORY_UID).create({ data: { name }, status: 'published' });
    }
  }

  const statuses = ['draft', 'published'];
  const entries = [];
  for (const status of statuses) {
    const posts = await app.documents(POST_UID).findMany({
      fields: ['slug', 'category'],
      status,
      limit: -1,
    });
    for (const post of posts) {
      entries.push({ documentId: post.documentId, slug: post.slug, status, category: post.category });
    }
  }

  console.log(`exporting ${entries.length} blog-post entries (draft + published) to ${MAP_PATH}`);
  if (DRY_RUN) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  fs.writeFileSync(MAP_PATH, JSON.stringify(entries, null, 2));
  console.log('done. Now swap blog-post.schema.json\'s `category` field to the relation shape, reboot, then run `apply`.');
}

async function applyPass(app) {
  if (!fs.existsSync(MAP_PATH)) {
    throw new Error(`No migration map found at ${MAP_PATH} — run the "export" pass first, before the schema swap.`);
  }
  const entries = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

  const categories = await app.documents(CATEGORY_UID).findMany({ fields: ['name'], limit: -1 });
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.documentId]));

  for (const entry of entries) {
    const categoryDocumentId = categoryIdByName.get(entry.category);
    if (!categoryDocumentId) {
      console.warn(`${entry.slug} (${entry.status}): no category entry found for "${entry.category}" — skipping`);
      continue;
    }
    console.log(`${entry.slug} (${entry.status}): ${DRY_RUN ? 'would relink' : 'relinking'} to "${entry.category}"`);
    if (!DRY_RUN) {
      await app.documents(POST_UID).update({
        documentId: entry.documentId,
        status: entry.status,
        data: { category: categoryDocumentId },
      });
    }
  }
  console.log(DRY_RUN ? 'dry run complete, no writes made.' : 'done.');
}

async function main() {
  if (mode !== 'export' && mode !== 'apply') {
    throw new Error('Usage: node scripts/migrate-category-enum-to-relation.js <export|apply> [--dry-run]');
  }

  const app = await createStrapi(await compileStrapi()).load();
  try {
    if (mode === 'export') await exportPass(app);
    else await applyPass(app);
  } finally {
    await app.destroy();
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
