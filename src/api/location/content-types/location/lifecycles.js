'use strict';

async function assertUniqueSlugAmongSiblings(data, currentDocumentId) {
  if (!data.slug) return;

  const parentId =
    typeof data.parent === 'object' && data.parent !== null
      ? data.parent.id ?? data.parent.connect?.[0]?.id ?? null
      : data.parent ?? null;

  const siblings = await strapi.documents('api::location.location').findMany({
    filters: { slug: data.slug, parent: parentId },
  });

  const conflict = siblings.find((sibling) => sibling.documentId !== currentDocumentId);
  if (conflict) {
    throw new Error(
      `A location with slug "${data.slug}" already exists under the same parent.`
    );
  }
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    await assertUniqueSlugAmongSiblings(data, null);
  },
  async beforeUpdate(event) {
    const { data, where } = event.params;
    if (!data || !Object.prototype.hasOwnProperty.call(data, 'slug')) return;
    await assertUniqueSlugAmongSiblings(data, where?.documentId ?? null);
  },
};
