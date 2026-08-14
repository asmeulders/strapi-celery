'use strict';

function resolveParentValue(data) {
  if (typeof data.parent === 'object' && data.parent !== null) {
    return data.parent.id ?? data.parent.connect?.[0]?.id ?? null;
  }
  return data.parent ?? null;
}

async function assertUniqueSlugAmongSiblings(data, currentDocumentId) {
  if (!data.slug) return;

  const parentValue = resolveParentValue(data);

  // Filter on slug only (a plain string field) and compare parents in JS --
  // filtering a relation field by literal `null` isn't valid query-engine
  // syntax and would 500 for root-level locations (states) with no parent.
  const candidates = await strapi.documents('api::location.location').findMany({
    filters: { slug: data.slug },
    populate: { parent: true },
  });

  strapi.log.info(
    `[location uniqueness debug] slug=${data.slug} currentDocumentId=${currentDocumentId} parentValue=${JSON.stringify(parentValue)} candidates=${JSON.stringify(candidates)}`
  );

  const conflict = candidates.find((candidate) => {
    if (candidate.documentId === currentDocumentId) return false;
    const candidateParentValue = candidate.parent ? candidate.parent.documentId : null;
    return candidateParentValue === parentValue;
  });

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
