/**
 * One-time migration: populates the new `content` dynamic zone on every blog
 * post from its existing `body` / `comparisonTable` / `inlineCta*` fields,
 * preserving today's effective render order (rich text, then comparison
 * table if non-empty, then inline CTA if present) so nothing visibly changes
 * for already-published posts until an editor rearranges the new zone.
 *
 * Idempotent: skips any post that already has a non-empty `content` zone, so
 * it's safe to re-run.
 *
 *   railway run node scripts/migrate-blog-content-zone.js --dry-run   # preview only, no writes
 *   railway run node scripts/migrate-blog-content-zone.js             # actually writes
 *
 * Old comparisonTable rows only had a true/false `positive` flag per cell
 * (green or nothing); the new model stores a raw color per cell. This
 * migration maps true -> #16A34A (green) and false -> #C0392B (red) so
 * existing tables render identically to how they do today.
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const POST_UID = 'api::blog-post.blog-post';
const DRY_RUN = process.argv.includes('--dry-run');

const GREEN = '#16A34A';
const RED = '#C0392B';

const OLD_COLUMN_LABELS = ['List with an agent', 'Sell it yourself (FSBO)', 'Cash buyer (TrueNorth)'];

function buildContentZone(post) {
  const zone = [];

  if (post.body) {
    zone.push({ __component: 'blog.rich-text', content: post.body });
  }

  if (Array.isArray(post.comparisonTable) && post.comparisonTable.length > 0) {
    zone.push({
      __component: 'blog.comparison-table',
      columns: OLD_COLUMN_LABELS.map((label) => ({ label })),
      rows: post.comparisonTable.map((row) => ({
        label: row.label,
        cells: [
          { value: row.agentColumn, highlight: row.agentPositive ? GREEN : RED },
          { value: row.fsboColumn, highlight: row.fsboPositive ? GREEN : RED },
          { value: row.cashColumn, highlight: row.cashPositive ? GREEN : RED },
        ],
      })),
    });
  }

  if (post.inlineCtaHeading && post.inlineCtaBody && post.inlineCtaButtonText) {
    zone.push({
      __component: 'blog.inline-cta',
      heading: post.inlineCtaHeading,
      body: post.inlineCtaBody,
      buttonText: post.inlineCtaButtonText,
    });
  }

  return zone;
}

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  try {
    const posts = await app.documents(POST_UID).findMany({
      fields: ['slug', 'body', 'inlineCtaHeading', 'inlineCtaBody', 'inlineCtaButtonText'],
      populate: { comparisonTable: true, content: true },
      status: 'published',
      limit: -1,
    });

    console.log(`found ${posts.length} published post(s)${DRY_RUN ? ' (dry run — no writes will be made)' : ''}`);

    for (const post of posts) {
      if (Array.isArray(post.content) && post.content.length > 0) {
        console.log(`skip   ${post.slug} (content already populated)`);
        continue;
      }

      const content = buildContentZone(post);
      console.log(`${DRY_RUN ? 'would update' : 'update'} ${post.slug} -> ${content.length} block(s)`);

      if (!DRY_RUN) {
        await app.documents(POST_UID).update({
          documentId: post.documentId,
          status: 'published',
          data: { content },
        });
      }
    }
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
