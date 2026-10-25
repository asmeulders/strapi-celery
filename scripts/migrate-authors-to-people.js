/**
 * Merges the `api::author.author` content-type into `api::person.person` and
 * re-points `blog-post.author` / `blog-post.reviewedBy` at people.
 *
 * Like migrate-category-enum-to-relation.js, this MUST run in two passes that
 * straddle the schema change: once `author` is deleted and blog-post's
 * relations target `person`, Strapi's startup schema sync drops the author
 * table and its link tables, so the author data and every post's
 * author/reviewedBy names have to be captured to disk first.
 *
 * Pass 1 — `export`. Reads the OLD database with plain read-only SQL and never boots
 * Strapi, because booting Strapi syncs the DB to the checked-out schema and, on the
 * new schema, drops the author table and legacy blog-post columns. That also means
 * `export` is safe to run from any checkout/branch, but it MUST run before the new
 * schema has ever been booted or deployed against that database:
 *   railway run node scripts/migrate-authors-to-people.js export --dry-run   # preview
 *   railway run node scripts/migrate-authors-to-people.js export             # writes map
 *
 *   Writes every author and every blog-post version's (draft + published)
 *   author/reviewedBy to scripts/author-migration-map.json, along with a backup
 *   of the legacy blog-post fields this schema change removes (body,
 *   inlineCta*, imageCaption, editorialDisclaimer, focusKeyword). Aborts if any
 *   post version has an empty `content` dynamic zone, because `body` is the
 *   only copy of that post's text and has to be hand-ported first. Refuses to run
 *   if the database already looks migrated (no author table / person link columns).
 *
 * --- deploy the new schema (author removed, person merged), reboot ---
 *
 * Pass 2 — run with the NEW schema in place:
 *   railway run node scripts/migrate-authors-to-people.js apply --dry-run    # preview
 *   railway run node scripts/migrate-authors-to-people.js apply             # migrates
 *
 *   1. Every pre-existing person without a slug gets one (slugified name) and
 *      `showOnAbout: true` — they're the current About-page team.
 *   2. Each exported author is matched to a person by case-insensitive name, or
 *      created as a new published person with `showOnAbout: false`. A matched
 *      person keeps its own values; the author only fills fields that are empty.
 *   3. Each blog-post version's author/reviewedBy is re-linked to the matching
 *      person version (draft post -> draft person, published -> published).
 *
 *   Writes go through the query engine row by row, so pending (unpublished)
 *   draft edits on people and posts are left as drafts, not published.
 *   Re-running `apply` is safe.
 */
const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const PERSON_UID = 'api::person.person';
const POST_UID = 'api::blog-post.blog-post';
const MAP_PATH = path.join(__dirname, 'author-migration-map.json');


const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const mode = args.find((a) => !a.startsWith('--'));

// Must match slugifyHeading() in the Next.js app (src/lib/blogContent.ts) so
// existing /blog/author/<slug> URLs keep resolving after the merge.
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, ' ');
const isEmpty = (value) => value === null || value === undefined || value === '';
const statusOf = (row) => (row.publishedAt ? 'published' : 'draft');

async function connect() {
  const mysql = require('mysql2/promise');
  const env = process.env;
  const sslCaPath = env.DATABASE_SSL_CA || path.join(__dirname, '..', 'config', 'certs', 'rds-global-bundle.pem');
  const ssl =
    env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
          ca: fs.existsSync(sslCaPath) ? fs.readFileSync(sslCaPath, 'utf8') : undefined,
        }
      : undefined;
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST || 'localhost',
    port: Number(env.DATABASE_PORT || 3306),
    database: env.DATABASE_NAME || 'strapi',
    user: env.DATABASE_USERNAME || 'strapi',
    password: env.DATABASE_PASSWORD || 'strapi',
    ssl,
  });
  await connection.query('SET SESSION TRANSACTION READ ONLY');
  console.log(`connected (read-only) to ${env.DATABASE_HOST || 'localhost'} / ${env.DATABASE_NAME || 'strapi'}`);
  return connection;
}

async function exportPass() {
  const db = await connect();
  try {
    const [tables] = await db.query("SHOW TABLES LIKE 'authors'");
    const [linkColumns] = await db.query("SHOW COLUMNS FROM blog_posts_author_lnk LIKE 'author_id'");
    if (tables.length === 0 || linkColumns.length === 0) {
      throw new Error(
        'This database has no `authors` table / `author_id` link column — the new schema has already been synced to it, ' +
          'so the author data is gone from the live tables. Restore from a backup taken before that, then run export again.'
      );
    }

    const [authorRows] = await db.query('SELECT * FROM authors');
    const [headshots] = await db.query(
      "SELECT related_id, file_id FROM files_related_mph WHERE related_type = 'api::author.author' AND field = 'headshot'"
    );
    const headshotByAuthor = new Map(headshots.map((h) => [h.related_id, h.file_id]));
    const authorEntries = authorRows.map((a) => ({
      documentId: a.document_id,
      name: a.name,
      role: a.role,
      bio: a.bio,
      linkedInUrl: a.linked_in_url ?? null,
      basedIn: a.based_in ?? null,
      headshotId: headshotByAuthor.get(a.id) ?? null,
    }));
    const documentIdByAuthorRow = new Map(authorRows.map((a) => [a.id, a.document_id]));

    const [postRows] = await db.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM blog_posts_cmps c WHERE c.entity_id = p.id AND c.field = 'content') AS content_blocks,
              (SELECT l.author_id FROM blog_posts_author_lnk l WHERE l.blog_post_id = p.id LIMIT 1) AS author_row,
              (SELECT l.author_id FROM blog_posts_reviewed_by_lnk l WHERE l.blog_post_id = p.id LIMIT 1) AS reviewed_by_row
         FROM blog_posts p`
    );

    const emptyContent = postRows.filter((p) => Number(p.content_blocks) === 0);
    if (emptyContent.length > 0) {
      for (const p of emptyContent) console.error(`${p.slug} (${p.published_at ? 'published' : 'draft'}): empty \`content\` dynamic zone`);
      throw new Error(
        `${emptyContent.length} blog-post version(s) have no \`content\` blocks. Move their \`body\` into the content zone before removing \`body\`.`
      );
    }

    const postEntries = postRows.map((p) => ({
      documentId: p.document_id,
      locale: p.locale ?? null,
      slug: p.slug,
      status: p.published_at ? 'published' : 'draft',
      authorDocumentId: documentIdByAuthorRow.get(p.author_row) ?? null,
      reviewedByDocumentId: documentIdByAuthorRow.get(p.reviewed_by_row) ?? null,
      legacy: {
        body: p.body ?? null,
        inlineCtaHeading: p.inline_cta_heading ?? null,
        inlineCtaBody: p.inline_cta_body ?? null,
        inlineCtaButtonText: p.inline_cta_button_text ?? null,
        imageCaption: p.image_caption ?? null,
        editorialDisclaimer: p.editorial_disclaimer ?? null,
        focusKeyword: p.focus_keyword ?? null,
      },
    }));

    for (const a of authorEntries) {
      const wrote = postEntries.filter((p) => p.authorDocumentId === a.documentId).length;
      const reviewed = postEntries.filter((p) => p.reviewedByDocumentId === a.documentId).length;
      console.log(`author "${a.name}": ${wrote} authored / ${reviewed} reviewed post version(s)`);
    }
    console.log(`exporting ${authorEntries.length} author(s) and ${postEntries.length} blog-post version(s) to ${MAP_PATH}`);
    if (DRY_RUN) {
      console.log(JSON.stringify({ authors: authorEntries, posts: postEntries.map(({ legacy, ...rest }) => rest) }, null, 2));
      return;
    }
    fs.writeFileSync(MAP_PATH, JSON.stringify({ exportedAt: new Date().toISOString(), authors: authorEntries, posts: postEntries }, null, 2));
    console.log('done. Now deploy the merged person schema, reboot, then run `apply`.');
  } finally {
    await db.end();
  }
}

/** All rows (draft + published) of every person, grouped by documentId. */
async function loadPeople(app) {
  const rows = await app.db.query(PERSON_UID).findMany({ populate: { photo: { select: ['id'] } } });
  const byDocument = new Map();
  for (const row of rows) {
    if (!byDocument.has(row.documentId)) byDocument.set(row.documentId, []);
    byDocument.get(row.documentId).push(row);
  }
  return byDocument;
}

async function updateRows(app, rows, data) {
  if (DRY_RUN || Object.keys(data).length === 0) return;
  for (const row of rows) {
    await app.db.query(PERSON_UID).update({ where: { id: row.id }, data });
  }
}

function uniqueSlug(base, takenSlugs) {
  let slug = base;
  for (let n = 2; takenSlugs.has(slug); n += 1) slug = `${base}-${n}`;
  takenSlugs.add(slug);
  return slug;
}

async function applyPass(app) {
  if (!fs.existsSync(MAP_PATH)) {
    throw new Error(`No migration map found at ${MAP_PATH} — run the "export" pass first, before the schema swap.`);
  }
  const { authors, posts } = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

  let people = await loadPeople(app);
  const takenSlugs = new Set([...people.values()].map((rows) => rows[0].slug).filter(Boolean));

  // 1. Backfill slug + showOnAbout on the people who existed before the merge.
  for (const rows of people.values()) {
    if (rows[0].slug) continue;
    const slug = uniqueSlug(slugify(rows[0].name), takenSlugs);
    console.log(`person "${rows[0].name}": ${DRY_RUN ? 'would set' : 'setting'} slug "${slug}", showOnAbout=true`);
    if (slug !== slugify(rows[0].name)) console.warn(`  slug collision — "${rows[0].name}" got "${slug}"`);
    await updateRows(app, rows, { slug, showOnAbout: true });
    rows.forEach((r) => Object.assign(r, { slug, showOnAbout: true }));
  }

  // 2. Match or create a person for each exported author.
  const personDocumentIdByAuthor = new Map();
  for (const author of authors) {
    const match = [...people.entries()].find(([, rows]) => normalizeName(rows[0].name) === normalizeName(author.name));
    if (match) {
      const [personDocumentId, rows] = match;
      const fill = {};
      for (const field of ['role', 'bio', 'linkedInUrl', 'basedIn']) {
        if (isEmpty(rows[0][field]) && !isEmpty(author[field])) fill[field] = author[field];
      }
      if (!rows[0].photo && author.headshotId) fill.photo = author.headshotId;
      console.log(
        `author "${author.name}": matched person "${rows[0].name}"` +
          (Object.keys(fill).length ? `; ${DRY_RUN ? 'would fill' : 'filling'} ${Object.keys(fill).join(', ')}` : '')
      );
      await updateRows(app, rows, fill);
      personDocumentIdByAuthor.set(author.documentId, personDocumentId);
      continue;
    }

    const slug = uniqueSlug(slugify(author.name), takenSlugs);
    console.log(`author "${author.name}": no matching person — ${DRY_RUN ? 'would create' : 'creating'} published person "${slug}"`);
    if (DRY_RUN) {
      personDocumentIdByAuthor.set(author.documentId, `(new:${slug})`);
      continue;
    }
    const created = await app.documents(PERSON_UID).create({
      status: 'published',
      data: {
        name: author.name,
        slug,
        role: author.role,
        bio: author.bio,
        linkedInUrl: author.linkedInUrl,
        basedIn: author.basedIn,
        photo: author.headshotId,
        showOnAbout: false,
      },
    });
    personDocumentIdByAuthor.set(author.documentId, created.documentId);
  }
  if (!DRY_RUN) people = await loadPeople(app);

  // 3. Re-link every blog-post version to the same-status person version.
  // The schema sync keeps the old link rows (same table name) but drops their
  // author column, leaving rows with a NULL person id; clear those first.
  for (const field of ['author', 'reviewedBy']) {
    const { joinTable } = app.db.metadata.get(POST_UID).attributes[field];
    const orphans = await app.db.connection(joinTable.name).whereNull(joinTable.inverseJoinColumn.name).count({ n: '*' });
    const n = Number(orphans[0].n);
    if (n === 0) continue;
    console.log(`${joinTable.name}: ${DRY_RUN ? 'would delete' : 'deleting'} ${n} orphaned link row(s)`);
    if (!DRY_RUN) await app.db.connection(joinTable.name).whereNull(joinTable.inverseJoinColumn.name).del();
  }
  const personRowId = (authorDocumentId, status) => {
    if (!authorDocumentId) return null;
    const personDocumentId = personDocumentIdByAuthor.get(authorDocumentId);
    if (!personDocumentId) throw new Error(`No person for author documentId ${authorDocumentId}`);
    if (DRY_RUN) return personDocumentId;
    const row = (people.get(personDocumentId) ?? []).find((r) => statusOf(r) === status);
    if (!row) throw new Error(`Person ${personDocumentId} has no ${status} version to link a ${status} post to — publish it first.`);
    return row.id;
  };

  for (const post of posts) {
    const where = { documentId: post.documentId, publishedAt: post.status === 'published' ? { $notNull: true } : null };
    if (post.locale) where.locale = post.locale;
    const row = await app.db.query(POST_UID).findOne({ where, select: ['id', 'dateModified'] });
    if (!row) {
      console.warn(`${post.slug} (${post.status}): post version no longer exists — skipping`);
      continue;
    }
    const data = {
      author: personRowId(post.authorDocumentId, post.status),
      reviewedBy: personRowId(post.reviewedByDocumentId, post.status),
      // Passed through unchanged so the blog-post beforeUpdate lifecycle
      // doesn't bump the public "Updated" date for a relation-only change.
      dateModified: row.dateModified,
    };
    console.log(`${post.slug} (${post.status}): ${DRY_RUN ? 'would relink' : 'relinking'} author/reviewedBy`);
    if (!DRY_RUN) await app.db.query(POST_UID).update({ where: { id: row.id }, data });
  }
  console.log(DRY_RUN ? 'dry run complete, no writes made.' : 'done.');
}

async function main() {
  if (mode !== 'export' && mode !== 'apply') {
    throw new Error('Usage: node scripts/migrate-authors-to-people.js <export|apply> [--dry-run]');
  }

  // `export` must not boot Strapi (see header); only `apply` needs the app.
  if (mode === 'export') return exportPass();

  const app = await createStrapi(await compileStrapi()).load();
  try {
    await applyPass(app);
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
