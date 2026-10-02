/**
 * One-off repair: prepends a rich-text block built from a post's legacy
 * `body` field to the front of its `content` dynamic zone.
 *
 * For posts where editing `content` directly in Strapi's admin dropped the
 * opening section, this recovers it — `body` is never written to by this
 * script or by scripts/migrate-blog-content-zone.js, so it's a safe,
 * untouched source of the original content.
 *
 *   railway run node scripts/restore-legacy-body-opening.js <slug> --dry-run   # preview only
 *   railway run node scripts/restore-legacy-body-opening.js <slug>             # actually writes
 */
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const POST_UID = 'api::blog-post.blog-post';
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const slug = args.find((a) => !a.startsWith('--'));

async function main() {
  if (!slug) {
    throw new Error('Usage: node scripts/restore-legacy-body-opening.js <slug> [--dry-run]');
  }

  const app = await createStrapi(await compileStrapi()).load();
  try {
    const [post] = await app.documents(POST_UID).findMany({
      filters: { slug },
      fields: ['slug', 'body'],
      populate: {
        content: {
          on: {
            'blog.rich-text': true,
            'blog.comparison-table': { populate: { columns: true, rows: { populate: { cells: true } } } },
            'blog.inline-cta': true,
          },
        },
      },
      status: 'published',
      limit: 1,
    });

    if (!post) {
      throw new Error(`No published post found with slug "${slug}"`);
    }
    if (!post.body || post.body.length === 0) {
      throw new Error(`Post "${slug}" has no legacy body content to restore from.`);
    }

    // Strip the Strapi-assigned `id` from each existing block — only needed when
    // referencing an existing component instance; a fresh write doesn't need it.
    const existingContent = (post.content || []).map(({ id, ...rest }) => rest);

    const newContent = [{ __component: 'blog.rich-text', content: post.body }, ...existingContent];

    console.log(
      `${slug}: prepending a rich-text block with ${post.body.length} node(s) to ${existingContent.length} existing block(s)`
    );

    if (DRY_RUN) {
      console.log(JSON.stringify(newContent, null, 2));
      return;
    }

    await app.documents(POST_UID).update({
      documentId: post.documentId,
      status: 'published',
      data: { content: newContent },
    });
    console.log(`${slug}: updated.`);
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
