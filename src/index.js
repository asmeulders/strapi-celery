'use strict';

const LOCATION_UID = 'api::location.location';
const MARKET_COMMENTARY_FIELD = 'marketCommentary';
const MARKET_COMMENTARY_BRIEF =
  '{{INVENTORY_TREND}} Two or three sentences of genuinely local market commentary: what inventory is doing in {{CITY}}, which price bands are moving, what is stalling, and why. Never reuse it on another city page.';

/**
 * Sets the Content Manager edit-view "description" hint for `marketCommentary` to the designer's
 * writing brief, so editors see it while filling the field in the admin — this hint lives only in
 * Strapi's core store (not schema.json, not the public API) and never reaches the website. Only
 * sets it if empty, so it won't clobber a human edit to the hint on a later restart.
 */
async function seedMarketCommentaryFieldHint(strapi) {
  const contentType = strapi.contentType(LOCATION_UID);
  const contentTypesService = strapi.plugin('content-manager').service('content-types');
  const configuration = await contentTypesService.findConfiguration(contentType);

  const existingDescription = configuration.metadatas?.[MARKET_COMMENTARY_FIELD]?.edit?.description;
  if (existingDescription) return;

  await contentTypesService.updateConfiguration(contentType, {
    layouts: configuration.layouts,
    settings: configuration.settings,
    metadatas: {
      ...configuration.metadatas,
      [MARKET_COMMENTARY_FIELD]: {
        ...configuration.metadatas[MARKET_COMMENTARY_FIELD],
        edit: {
          ...configuration.metadatas[MARKET_COMMENTARY_FIELD].edit,
          description: MARKET_COMMENTARY_BRIEF,
        },
      },
    },
  });
}

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    await seedMarketCommentaryFieldHint(strapi);
  },
};
