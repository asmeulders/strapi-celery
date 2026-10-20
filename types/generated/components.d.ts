import type { Schema, Struct } from '@strapi/strapi';

export interface BlogComparisonCell extends Struct.ComponentSchema {
  collectionName: 'components_blog_comparison_cells';
  info: {
    displayName: 'Comparison Cell';
    icon: 'stack';
  };
  attributes: {
    highlight: Schema.Attribute.String &
      Schema.Attribute.CustomField<'plugin::color-picker.color'>;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogComparisonColumn extends Struct.ComponentSchema {
  collectionName: 'components_blog_comparison_columns';
  info: {
    displayName: 'Comparison Column';
    icon: 'layout-grid';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogComparisonTable extends Struct.ComponentSchema {
  collectionName: 'components_blog_comparison_tables';
  info: {
    displayName: 'Comparison Table';
    icon: 'layout-grid';
  };
  attributes: {
    columns: Schema.Attribute.Component<'blog.comparison-column', true>;
    rows: Schema.Attribute.Component<'blog.comparison-table-row', true>;
  };
}

export interface BlogComparisonTableRow extends Struct.ComponentSchema {
  collectionName: 'components_blog_comparison_table_rows';
  info: {
    displayName: 'Comparison Table Row';
    icon: 'layout-grid';
  };
  attributes: {
    cells: Schema.Attribute.Component<'blog.comparison-cell', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_blog_faq_items';
  info: {
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogInlineCta extends Struct.ComponentSchema {
  collectionName: 'components_blog_inline_ctas';
  info: {
    displayName: 'Inline CTA';
    icon: 'cursor';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    buttonText: Schema.Attribute.String & Schema.Attribute.Required;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogKeyTakeaway extends Struct.ComponentSchema {
  collectionName: 'components_blog_key_takeaways';
  info: {
    displayName: 'Key Takeaway';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogRichText extends Struct.ComponentSchema {
  collectionName: 'components_blog_rich_texts';
  info: {
    displayName: 'Rich Text';
    icon: 'align-left';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface BlogSourceItem extends Struct.ComponentSchema {
  collectionName: 'components_blog_source_items';
  info: {
    displayName: 'Source Item';
    icon: 'bookmark';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BusinessOffice extends Struct.ComponentSchema {
  collectionName: 'components_business_offices';
  info: {
    displayName: 'Office';
    icon: 'pinMap';
  };
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required;
    state: Schema.Attribute.String & Schema.Attribute.Required;
    street: Schema.Attribute.String & Schema.Attribute.Required;
    zip: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BusinessOwner extends Struct.ComponentSchema {
  collectionName: 'components_business_owners';
  info: {
    displayName: 'Owner';
    icon: 'user';
  };
  attributes: {
    initials: Schema.Attribute.String & Schema.Attribute.Required;
    linkedInUrl: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    role: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationDeal extends Struct.ComponentSchema {
  collectionName: 'components_location_deals';
  info: {
    displayName: 'Deal';
    icon: 'house';
  };
  attributes: {
    condition: Schema.Attribute.String;
    days: Schema.Attribute.String;
    hood: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    situation: Schema.Attribute.String;
    street: Schema.Attribute.String & Schema.Attribute.Required;
    zip: Schema.Attribute.String;
  };
}

export interface LocationFaq extends Struct.ComponentSchema {
  collectionName: 'components_location_faqs';
  info: {
    displayName: 'Location FAQ';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationMarket extends Struct.ComponentSchema {
  collectionName: 'components_location_markets';
  info: {
    displayName: 'Market';
    icon: 'chartBubble';
  };
  attributes: {
    asOf: Schema.Attribute.String;
    avgCommission: Schema.Attribute.String;
    avgDom: Schema.Attribute.String;
    inventoryTrend: Schema.Attribute.Text;
    medianPrice: Schema.Attribute.String;
    source: Schema.Attribute.String;
  };
}

export interface LocationOfferMath extends Struct.ComponentSchema {
  collectionName: 'components_location_offer_maths';
  info: {
    displayName: 'Offer Math';
    icon: 'calculator';
  };
  attributes: {
    cashOffer: Schema.Attribute.String;
    closingAmt: Schema.Attribute.String;
    commissionAmt: Schema.Attribute.String;
    holdingAmt: Schema.Attribute.String;
    listPrice: Schema.Attribute.String;
    negotiationAmt: Schema.Attribute.String;
    tradNet: Schema.Attribute.String;
    tradTime: Schema.Attribute.String;
  };
}

export interface LocationRecentSeller extends Struct.ComponentSchema {
  collectionName: 'components_location_recent_sellers';
  info: {
    displayName: 'Recent Seller';
    icon: 'user';
  };
  attributes: {
    closedDate: Schema.Attribute.String;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    street: Schema.Attribute.String & Schema.Attribute.Required;
    zip: Schema.Attribute.String;
  };
}

export interface LocationStringItem extends Struct.ComponentSchema {
  collectionName: 'components_location_string_items';
  info: {
    displayName: 'String Item';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LocationTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_location_testimonials';
  info: {
    displayName: 'Testimonial';
    icon: 'quote';
  };
  attributes: {
    hood: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    quote: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blog.comparison-cell': BlogComparisonCell;
      'blog.comparison-column': BlogComparisonColumn;
      'blog.comparison-table': BlogComparisonTable;
      'blog.comparison-table-row': BlogComparisonTableRow;
      'blog.faq-item': BlogFaqItem;
      'blog.inline-cta': BlogInlineCta;
      'blog.key-takeaway': BlogKeyTakeaway;
      'blog.rich-text': BlogRichText;
      'blog.source-item': BlogSourceItem;
      'business.office': BusinessOffice;
      'business.owner': BusinessOwner;
      'location.deal': LocationDeal;
      'location.faq': LocationFaq;
      'location.market': LocationMarket;
      'location.offer-math': LocationOfferMath;
      'location.recent-seller': LocationRecentSeller;
      'location.string-item': LocationStringItem;
      'location.testimonial': LocationTestimonial;
    }
  }
}
