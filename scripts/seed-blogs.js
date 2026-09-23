/**
 * Seeds 6 mock real-estate blog posts (plus 2 authors) for design/QA.
 * Idempotent: authors are matched by name, posts by slug.
 *
 *   node scripts/seed-blogs.js
 *
 * Refuses to run against a remote (RDS) database unless ALLOW_REMOTE_SEED=1.
 */
const fs = require('fs');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const POST_UID = 'api::blog-post.blog-post';
const AUTHOR_UID = 'api::author.author';
const IMAGE_DIR = path.join(__dirname, 'seed-images');
const DISCLAIMER =
  'Sample content for design and QA purposes only. Figures and names are illustrative and are not real market data or professional advice.';

// --- blocks helpers -------------------------------------------------------
const t = (text) => ({ type: 'text', text });
const h2 = (text) => ({ type: 'heading', level: 2, children: [t(text)] });
const p = (text) => ({ type: 'paragraph', children: [t(text)] });
const ul = (items) => ({
  type: 'list',
  format: 'unordered',
  children: items.map((i) => ({ type: 'list-item', children: [t(i)] })),
});
const ol = (items) => ({ ...ul(items), format: 'ordered' });

const authors = [
  {
    name: 'Dana Whitfield',
    role: 'Broker Associate',
    credential: 'Licensed Real Estate Broker, 14 years experience',
    bio: 'Dana has guided more than 400 sellers through listing, negotiation and closing. She writes about pricing strategy and getting homes market-ready.',
    authorPageUrl: '/about/dana-whitfield',
    linkedInUrl: 'https://www.linkedin.com/in/example-dana-whitfield',
  },
  {
    name: 'Marcus Ellery',
    role: 'Real Estate Attorney',
    credential: 'J.D., Real Estate Law',
    bio: 'Marcus advises buyers, sellers and investors on contracts, disclosures and closings, and reviews our legal and process content for accuracy.',
    authorPageUrl: '/about/marcus-ellery',
    linkedInUrl: 'https://www.linkedin.com/in/example-marcus-ellery',
  },
];

const posts = [
  {
    image: 'agent-fsbo-cash.jpg',
    author: 'Dana Whitfield',
    reviewedBy: 'Marcus Ellery',
    title: 'Agent vs. FSBO vs. Cash Offer: How Should You Sell Your Home?',
    cardTitle: 'Agent, FSBO or Cash Offer?',
    category: 'Selling Tips',
    targetLocation: 'Austin, TX',
    datePublished: '2026-08-04',
    dateModified: '2026-09-10',
    dek: 'Three ways to sell, three very different trade-offs in price, speed, effort and risk. Here is how to choose.',
    coverImageAlt: 'Miniature house model resting on a wooden table next to a set of house keys',
    imageCaption: 'The right selling route depends on your timeline and your net proceeds.',
    keyTakeaways: [
      'Listing with an agent typically nets the highest sale price but takes the longest.',
      'FSBO saves on commission but shifts marketing, negotiation and paperwork onto you.',
      'Cash buyers close fastest, usually at a discount to market value.',
      'Compare net proceeds, not just headline price.',
    ],
    body: [
      p('Selling a home is one of the largest financial transactions most people make. Before you pick a route, it helps to understand what each one actually asks of you.'),
      h2('Selling with a listing agent'),
      p('An agent prices the home using recent comparable sales, markets it across the MLS and their network, and manages showings, offers and closing. You pay a commission, but exposure to more buyers often leads to a stronger final price.'),
      h2('Selling for sale by owner (FSBO)'),
      p('Going FSBO means you keep the commission you would have paid a listing agent. In exchange you handle pricing, photography, showings, negotiation and disclosures yourself.'),
      ul([
        'You control the schedule and the message.',
        'You carry the legal exposure if a disclosure is missed.',
        'Buyers who are represented may still expect you to cover their agent.',
      ]),
      h2('Accepting a cash offer'),
      p('Cash buyers skip mortgage underwriting, so closings can happen in as little as seven to ten days. That certainty is valuable if you are relocating or dealing with an inherited or distressed property.'),
      h2('How to decide'),
      ol([
        'Estimate your net proceeds under each option after fees, repairs and carrying costs.',
        'Decide how much time and effort you are willing to spend.',
        'Get at least one agent valuation and one cash offer to compare side by side.',
      ]),
    ],
    comparisonTable: [
      { label: 'Typical sale price', agentColumn: 'Highest', agentPositive: true, fsboColumn: 'Near market', fsboPositive: false, cashColumn: 'Below market', cashPositive: false },
      { label: 'Time to close', agentColumn: '30–60 days', agentPositive: false, fsboColumn: '45–90 days', fsboPositive: false, cashColumn: '7–14 days', cashPositive: true },
      { label: 'Commission / fees', agentColumn: 'Agent commission', agentPositive: false, fsboColumn: 'None to listing side', fsboPositive: true, cashColumn: 'Usually none', cashPositive: true },
      { label: 'Your effort', agentColumn: 'Low', agentPositive: true, fsboColumn: 'High', fsboPositive: false, cashColumn: 'Very low', cashPositive: true },
      { label: 'Deal certainty', agentColumn: 'Moderate', agentPositive: false, fsboColumn: 'Moderate', fsboPositive: false, cashColumn: 'High', cashPositive: true },
    ],
    inlineCtaHeading: 'Not sure which route fits you?',
    inlineCtaBody: 'Request a free home valuation and a side-by-side estimate of your net proceeds.',
    inlineCtaButtonText: 'Get my home valuation',
    faq: [
      { question: 'Is FSBO really cheaper?', answer: 'You avoid paying a listing agent, but homes sold FSBO often sell for less and you take on the cost and risk of marketing and paperwork yourself. Compare net proceeds before deciding.' },
      { question: 'Why are cash offers lower?', answer: 'Cash buyers are paying for speed and certainty and often plan to renovate or resell, so they price in repair costs and their own margin.' },
      { question: 'Can I get a cash offer and list with an agent?', answer: 'Yes. Many sellers collect a cash offer first to use as a floor, then list with an agent to see whether the open market beats it.' },
    ],
    sources: ['Sample source: Industry association seller profile (illustrative).', 'Sample source: Local MLS days-on-market report (illustrative).'],
    focusKeyword: 'sell home agent vs fsbo vs cash',
  },
  {
    image: 'staging.jpg',
    author: 'Dana Whitfield',
    reviewedBy: null,
    title: '7 Staging Fixes That Help Your Home Sell Faster',
    cardTitle: '7 Staging Fixes for a Faster Sale',
    category: 'Selling Tips',
    targetLocation: 'Denver, CO',
    datePublished: '2026-07-15',
    dateModified: '2026-07-15',
    dek: 'You do not need a full renovation. These low-cost staging changes make buyers linger and offers come in sooner.',
    coverImageAlt: 'Bright staged living room with a tan leather sofa, plants and pendant lights',
    imageCaption: 'Neutral colors, natural light and clear surfaces help buyers picture themselves in the space.',
    keyTakeaways: [
      'Declutter first; it is the cheapest change with the biggest impact.',
      'Maximize natural light and fresh, neutral paint.',
      'Curb appeal shapes the first impression before buyers step inside.',
    ],
    body: [
      p('Buyers decide quickly. Most form an opinion within the first few minutes of a showing, and online they decide in seconds. Staging is about removing distractions and showing off what is already good.'),
      h2('The seven fixes'),
      ol([
        'Declutter counters, shelves and closets.',
        'Deep clean, including windows, grout and appliances.',
        'Repaint bold walls in soft neutrals.',
        'Replace dated or dim light bulbs and open every curtain.',
        'Rearrange furniture to improve flow and highlight the room’s purpose.',
        'Refresh the entry with a clean door, house numbers and a mat.',
        'Add simple touches such as plants and fresh linens.',
      ]),
      h2('Where to spend and where to skip'),
      p('Paint, lighting and cleaning offer the best return. Skip major kitchen or bath remodels right before listing unless something is broken or badly out of date, since buyers often want to choose their own finishes.'),
    ],
    comparisonTable: [],
    inlineCtaHeading: 'Want a staging walkthrough?',
    inlineCtaBody: 'Our agents will walk your home and prioritize the fixes that matter for your market.',
    inlineCtaButtonText: 'Book a walkthrough',
    faq: [
      { question: 'How much does staging cost?', answer: 'DIY staging can cost little beyond cleaning and paint. Professional staging is usually priced by room and by month, so ask for a quote.' },
      { question: 'Do I need to stage a vacant home?', answer: 'Empty rooms can feel smaller and colder in photos. Staging key rooms such as the living room and primary bedroom is often worthwhile.' },
    ],
    sources: ['Sample source: Staging industry survey (illustrative).'],
    focusKeyword: 'home staging tips',
  },
  {
    image: 'market-snapshot.jpg',
    author: 'Dana Whitfield',
    reviewedBy: null,
    title: 'Seattle Housing Market Snapshot: What Sellers Should Know This Fall',
    cardTitle: 'Seattle Market Snapshot: Fall',
    category: 'Market News',
    targetLocation: 'Seattle, WA',
    datePublished: '2026-09-18',
    dateModified: '2026-09-18',
    dek: 'Inventory is rising, days on market are stretching and pricing strategy matters more than it did a year ago.',
    coverImageAlt: 'Modern glass high-rise buildings against a clear evening sky',
    imageCaption: 'A more balanced market rewards realistic pricing.',
    keyTakeaways: [
      'More listings mean buyers have more choice, so pricing accuracy matters.',
      'Well-presented homes in popular neighborhoods still move quickly.',
      'Autumn buyers tend to be motivated by relocation and school schedules.',
    ],
    body: [
      p('After several years of tight supply, many neighborhoods are seeing a gradual shift toward balance. That does not mean a bad market for sellers, but it does mean the days of guaranteed bidding wars are not universal.'),
      h2('What is changing'),
      ul([
        'Active listings are up compared with the same period last year.',
        'Median days on market have crept higher, especially above the mid-price range.',
        'Price reductions are more common on homes listed above comparable sales.',
      ]),
      h2('What it means for sellers'),
      p('Price to the current market rather than last spring’s peak, invest in strong photography, and be ready to respond to offers quickly. Buyers who tour in fall are generally serious.'),
    ],
    comparisonTable: [],
    inlineCtaHeading: 'Curious what your home is worth today?',
    inlineCtaBody: 'Get a neighborhood-level pricing estimate based on recent nearby sales.',
    inlineCtaButtonText: 'Check my home value',
    faq: [
      { question: 'Is fall a good time to sell?', answer: 'It can be. Competition from new listings is lower than in spring, and buyers who are out looking tend to be motivated.' },
    ],
    sources: ['Sample source: Regional MLS monthly statistics (illustrative).'],
    focusKeyword: 'seattle housing market',
  },
  {
    image: 'mortgage-rates.jpg',
    author: 'Marcus Ellery',
    reviewedBy: null,
    title: 'What Mortgage Rate Changes Mean for Home Sellers',
    cardTitle: 'Mortgage Rates and Sellers',
    category: 'Market News',
    targetLocation: 'Nationwide',
    datePublished: '2026-09-02',
    dateModified: '2026-09-12',
    dek: 'Even if you are not buying, interest rates shape who can afford your home. Here is how to read the shifts.',
    coverImageAlt: 'Laptop displaying a financial analytics dashboard with charts',
    imageCaption: 'Monthly payments, not list prices, drive what buyers can afford.',
    keyTakeaways: [
      'A small rate change can move a buyer’s monthly payment noticeably.',
      'Rate drops tend to bring more buyers into the market, increasing competition.',
      'Sellers with existing low-rate mortgages may weigh the cost of moving.',
    ],
    body: [
      p('Buyers think in monthly payments. When rates fall, the same budget stretches to a higher price; when they rise, it shrinks. That affects your buyer pool and how aggressive your pricing can be.'),
      h2('How rate moves reach your sale'),
      p('A drop in rates typically increases showing traffic within weeks. A rise can slow offers and lead buyers to request concessions such as rate buydowns.'),
      h2('Ways sellers can respond'),
      ul([
        'Offer a seller-paid rate buydown to lower the buyer’s payment.',
        'Price using recent closed sales, not asking prices.',
        'Talk with a lender to understand what your likely buyers can afford.',
      ]),
    ],
    comparisonTable: [],
    inlineCtaHeading: 'Talk through your options',
    inlineCtaBody: 'An agent can model how today’s rates affect your pricing and net proceeds.',
    inlineCtaButtonText: 'Speak with an agent',
    faq: [
      { question: 'Should I wait for rates to drop before selling?', answer: 'Timing the market is difficult. If lower rates draw more buyers, they may also draw more sellers. Consider your own timeline and needs first.' },
      { question: 'What is a rate buydown?', answer: 'A buydown is prepaid interest, often funded by the seller, that lowers the buyer’s mortgage rate for a period of time or for the life of the loan.' },
    ],
    sources: ['Sample source: Weekly mortgage rate survey (illustrative).'],
    focusKeyword: 'mortgage rates home sellers',
  },
  {
    image: 'closing-costs.jpg',
    author: 'Marcus Ellery',
    reviewedBy: 'Marcus Ellery',
    title: 'Closing Costs and Disclosures: A Seller’s Checklist',
    cardTitle: 'Seller’s Closing Cost Checklist',
    category: 'Legal & Process',
    targetLocation: 'Portland, OR',
    datePublished: '2026-06-22',
    dateModified: '2026-09-01',
    dek: 'Know what you will pay and what you must disclose before you sign, so nothing derails your closing.',
    coverImageAlt: 'Person signing documents at a desk with a pen',
    imageCaption: 'Read every document before you sign it.',
    keyTakeaways: [
      'Sellers usually pay agent commissions, transfer taxes and any agreed credits.',
      'Disclosure rules vary by state; incomplete disclosures can lead to legal claims.',
      'Request a preliminary settlement statement early to avoid surprises.',
    ],
    body: [
      p('Closing day is when the numbers become real. Understanding the seller’s side of the settlement statement helps you predict your net proceeds.'),
      h2('Common seller costs'),
      ul([
        'Agent commissions',
        'Transfer or excise taxes',
        'Title insurance and escrow fees, depending on local custom',
        'Payoff of your existing mortgage and prorated property taxes',
        'Any repair credits or concessions negotiated with the buyer',
      ]),
      h2('Disclosures'),
      p('Most states require sellers to disclose known material defects, such as water intrusion, foundation problems or lead paint in older homes. When in doubt, disclose and document it.'),
      h2('Before you sign'),
      ol([
        'Review the purchase agreement and any addenda.',
        'Ask for a preliminary settlement statement.',
        'Confirm the payoff amount with your lender.',
        'Consult an attorney if anything is unclear.',
      ]),
    ],
    comparisonTable: [],
    inlineCtaHeading: 'Need help reading your contract?',
    inlineCtaBody: 'Our transaction team can walk you through each document before closing.',
    inlineCtaButtonText: 'Contact our team',
    faq: [
      { question: 'Who pays closing costs?', answer: 'It is negotiable and varies by market. Sellers commonly cover commissions and transfer taxes, while buyers cover lender fees.' },
      { question: 'What happens if I forget to disclose a defect?', answer: 'You could face claims after closing, including for repair costs or damages. Disclose anything you know and keep records.' },
    ],
    sources: ['Sample source: State real estate commission disclosure guide (illustrative).', 'Sample source: Title and escrow association overview (illustrative).'],
    focusKeyword: 'seller closing costs',
  },
  {
    image: 'rental-property.jpg',
    author: 'Dana Whitfield',
    reviewedBy: 'Marcus Ellery',
    title: 'How to Evaluate a Rental Property Before You Buy',
    cardTitle: 'Evaluating a Rental Property',
    category: 'Investor Insights',
    targetLocation: 'Nashville, TN',
    datePublished: '2026-05-30',
    dateModified: '2026-08-20',
    dek: 'Cap rate, cash flow and reserves: the numbers every first-time investor should run before making an offer.',
    coverImageAlt: 'Craftsman-style house glowing at dusk with lights on inside',
    imageCaption: 'A great-looking property still has to pencil out.',
    keyTakeaways: [
      'Estimate net operating income using realistic vacancy and maintenance figures.',
      'Cap rate compares properties; cash-on-cash return reflects your financing.',
      'Keep cash reserves for repairs and vacancies.',
    ],
    body: [
      p('A rental is a small business. Before making an offer, run the math conservatively and stress-test it against a slow month or an unexpected repair.'),
      h2('The core numbers'),
      ul([
        'Gross rent: comparable monthly rents multiplied by twelve.',
        'Operating expenses: taxes, insurance, maintenance, management and vacancy.',
        'Net operating income (NOI): gross rent minus operating expenses.',
        'Cap rate: NOI divided by purchase price.',
        'Cash-on-cash return: annual pre-tax cash flow divided by cash invested.',
      ]),
      h2('A simple example'),
      p('Suppose a property earns 30,000 dollars a year in rent and has 11,000 dollars in operating expenses. NOI is 19,000 dollars; at a 300,000 dollar price the cap rate is roughly 6.3 percent. Financing costs then determine your actual cash flow.'),
      h2('Common mistakes'),
      ul([
        'Ignoring vacancy and turnover costs.',
        'Underestimating capital expenses like roofs and HVAC.',
        'Buying without checking local landlord-tenant rules.',
      ]),
    ],
    comparisonTable: [],
    inlineCtaHeading: 'Looking for investment properties?',
    inlineCtaBody: 'Tell us your target return and area and we will send matching listings.',
    inlineCtaButtonText: 'Talk to an investor specialist',
    faq: [
      { question: 'What is a good cap rate?', answer: 'It depends on the market and property type. Higher cap rates usually signal more risk or less appreciation potential.' },
      { question: 'How much should I reserve for repairs?', answer: 'Many investors set aside several months of expenses plus an annual maintenance budget. Older properties may need more.' },
    ],
    sources: ['Sample source: Landlord and property management guide (illustrative).'],
    focusKeyword: 'evaluate rental property',
  },
];

// --- seeding ---------------------------------------------------------------
const mimeOf = (file) => (file.endsWith('.png') ? 'image/png' : 'image/jpeg');

async function upload(strapi, file) {
  const filepath = path.join(IMAGE_DIR, file);
  const [uploaded] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: file, alternativeText: file.replace(/\.\w+$/, '').replace(/-/g, ' ') } },
    files: {
      filepath,
      originalFilename: file,
      mimetype: mimeOf(file),
      size: fs.statSync(filepath).size,
    },
  });
  return uploaded;
}

async function main() {
  const host = process.env.DATABASE_HOST || '';
  if (/amazonaws\.com/.test(host) && process.env.ALLOW_REMOTE_SEED !== '1') {
    throw new Error(`Refusing to seed remote database ${host}. Set ALLOW_REMOTE_SEED=1 to override.`);
  }

  const app = await createStrapi(await compileStrapi()).load();
  try {
    const authorIds = {};
    for (const a of authors) {
      const [existing] = await app.documents(AUTHOR_UID).findMany({ filters: { name: a.name }, limit: 1 });
      const doc = existing || (await app.documents(AUTHOR_UID).create({ data: a }));
      authorIds[a.name] = doc.documentId;
    }

    for (const { image, author, reviewedBy, ...post } of posts) {
      const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const [existing] = await app.documents(POST_UID).findMany({ filters: { slug }, limit: 1 });
      if (existing) {
        console.log(`skip   ${slug} (exists)`);
        continue;
      }
      const cover = await upload(app, image);
      await app.documents(POST_UID).create({
        status: 'published',
        data: {
          ...post,
          slug,
          author: authorIds[author],
          reviewedBy: reviewedBy ? authorIds[reviewedBy] : null,
          coverImage: cover.id,
          ogImage: cover.id,
          keyTakeaways: post.keyTakeaways.map((text) => ({ text })),
          sources: post.sources.map((text) => ({ text })),
          editorialDisclaimer: DISCLAIMER,
          metaTitle: post.title.length > 60 ? post.cardTitle : post.title,
          metaDescription: post.dek,
          ogTitle: post.title,
          ogDescription: post.dek,
          canonicalUrl: `/blog/${slug}`,
        },
      });
      console.log(`create ${slug}`);
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
