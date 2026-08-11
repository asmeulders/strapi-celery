import type { Schema, Struct } from '@strapi/strapi';

export interface BlogComparisonRow extends Struct.ComponentSchema {
  collectionName: 'components_blog_comparison_rows';
  info: {
    displayName: 'Comparison Row';
    icon: 'layout-grid';
  };
  attributes: {
    agentColumn: Schema.Attribute.String & Schema.Attribute.Required;
    agentPositive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    cashColumn: Schema.Attribute.String & Schema.Attribute.Required;
    cashPositive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    fsboColumn: Schema.Attribute.String & Schema.Attribute.Required;
    fsboPositive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
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

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blog.comparison-row': BlogComparisonRow;
      'blog.faq-item': BlogFaqItem;
      'blog.key-takeaway': BlogKeyTakeaway;
      'blog.source-item': BlogSourceItem;
    }
  }
}
