// google-ads-fields.js - Centralized Google Ads API field definitions
// Based on your current server.js queries

export const CORE_FIELDS = {
  customer: [
    'customer.id',
    'customer.descriptive_name',
    'customer.currency_code',
    'customer.time_zone',
    'customer.auto_tagging_enabled',
    'customer.manager',
    'customer.test_account'
  ],

  campaign: [
    'campaign.id',
    'campaign.name',
    'campaign.status',
    'campaign.serving_status',
    'campaign.advertising_channel_type',
    'campaign.advertising_channel_sub_type',
    'campaign.bidding_strategy_type',
    'campaign.start_date',
    'campaign.end_date'
  ],

  adGroup: [
    'ad_group.id',
    'ad_group.name',
    'ad_group.status',
    'ad_group.type'
  ],

  keyword: [
    'ad_group_criterion.keyword.text',
    'ad_group_criterion.keyword.match_type',
    'ad_group_criterion.quality_info.quality_score',
    'ad_group_criterion.quality_info.creative_quality_score',
    'ad_group_criterion.quality_info.post_click_quality_score',
    'ad_group_criterion.quality_info.search_predicted_ctr',
    'ad_group_criterion.status'
  ],

  ad: [
    'ad_group_ad.ad.id',
    'ad_group_ad.ad.type',
    'ad_group_ad.ad.expanded_text_ad.headline_part1',
    'ad_group_ad.ad.expanded_text_ad.headline_part2',
    'ad_group_ad.ad.expanded_text_ad.description',
    'ad_group_ad.ad.responsive_search_ad.headlines',
    'ad_group_ad.ad.responsive_search_ad.descriptions',
    'ad_group_ad.status'
  ],

  shopping: [
    'segments.product_item_id',
    'segments.product_title',
    'segments.product_brand',
    'segments.product_category_level1',
    'segments.product_category_level2',
    'segments.product_category_level3',
    'segments.product_condition',
    'segments.product_country',
    'segments.product_language'
  ],

  searchTerms: [
    'search_term_view.search_term',
    'search_term_view.status'
  ],

  geographic: [
    'geographic_view.country_criterion_id',
    'geographic_view.location_type'
  ]
};

export const SEGMENT_FIELDS = {
  time: [
    'segments.date',
    'segments.day_of_week',
    'segments.hour',
    'segments.month',
    'segments.quarter',
    'segments.week',
    'segments.year'
  ],

  device: [
    'segments.device',
    'segments.click_type'
  ],

  geographic: [
    'segments.geo_target_city',
    'segments.geo_target_region',
    'segments.geo_target_country',
    'segments.geo_target_metro'
  ],

  customer: [
    'segments.new_versus_returning_customers'
  ]
};

export const METRIC_FIELDS = {
  core: [
    'metrics.impressions',
    'metrics.clicks',
    'metrics.cost_micros',
    'metrics.conversions',
    'metrics.conversions_value',
    'metrics.view_through_conversions'
  ],

  rates: [
    'metrics.ctr',
    'metrics.average_cpc',
    'metrics.average_cpm',
    'metrics.cost_per_conversion',
    'metrics.value_per_conversion'
  ],

  impressionShare: [
    'metrics.search_impression_share',
    'metrics.search_budget_lost_impression_share',
    'metrics.search_rank_lost_impression_share',
    'metrics.search_exact_match_impression_share',
    'metrics.content_impression_share',
    'metrics.content_budget_lost_impression_share',
    'metrics.content_rank_lost_impression_share'
  ],

  video: [
    'metrics.video_views',
    'metrics.video_view_rate',
    'metrics.average_cpv'
  ]
};

// Pre-built query sets for common analysis types
export const QUERY_TEMPLATES = {
  // Account Overview Query
  accountOverview: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.customer.join(',\n      ')}
    FROM customer
  `,

  // Campaign Intelligence Query  
  campaignIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.customer.slice(0, 1).join(',\n      ')},
      ${CORE_FIELDS.campaign.join(',\n      ')},
      ${SEGMENT_FIELDS.time.join(',\n      ')},
      ${SEGMENT_FIELDS.device.slice(0, 2).join(',\n      ')},
      ${METRIC_FIELDS.core.join(',\n      ')},
      ${METRIC_FIELDS.rates.join(',\n      ')}
    FROM campaign 
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `,

  // Impression Share Analysis
  impressionShareIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 4).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(0, 4).join(',\n      ')},
      ${METRIC_FIELDS.impressionShare.slice(0, 4).join(',\n      ')}
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
      AND campaign.advertising_channel_type = 'SEARCH'
    ORDER BY metrics.search_impression_share DESC
  `,

  // Shopping Intelligence Query
  shoppingIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.adGroup.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.shopping.join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM shopping_performance_view
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.conversions_value DESC
  `,

  // Performance Max Intelligence
  performanceMaxIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 3).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(0, 5).join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
      AND metrics.impressions > 0
    ORDER BY metrics.conversions DESC
  `,

  // Customer Lifetime Value Intelligence
  customerLifetimeValueIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${SEGMENT_FIELDS.customer.join(',\n      ')},
      ${METRIC_FIELDS.core.slice(3, 5).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(2, 3).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(1, 2).join(',\n      ')}
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND metrics.conversions > 0
    ORDER BY metrics.conversions_value DESC
  `,

  // Search Terms Intelligence
  searchTermsIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.searchTerms.join(',\n      ')},
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.adGroup.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.keyword.slice(0, 2).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${SEGMENT_FIELDS.device.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM search_term_view 
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.conversions_value DESC
  `,

  // Keyword Intelligence
  keywordIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.adGroup.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.keyword.join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${SEGMENT_FIELDS.device.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(0, 4).join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')},
      ${METRIC_FIELDS.impressionShare.slice(0, 1).join(',\n      ')}
    FROM keyword_view 
    WHERE segments.date DURING ${dateRange}
      AND ad_group_criterion.status = 'ENABLED'
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `,

  // Ad Intelligence
  adIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.adGroup.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.ad.join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${SEGMENT_FIELDS.device.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.slice(0, 4).join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM ad_group_ad 
    WHERE segments.date DURING ${dateRange}
      AND ad_group_ad.status = 'ENABLED'
      AND metrics.impressions > 0
    ORDER BY metrics.conversions DESC
  `,

  // Geographic Intelligence
  locationIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.adGroup.slice(1, 2).join(',\n      ')},
      ${CORE_FIELDS.geographic.join(',\n      ')},
      ${SEGMENT_FIELDS.geographic.slice(0, 2).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 1).join(',\n      ')},
      ${METRIC_FIELDS.core.join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM geographic_view 
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY metrics.conversions_value DESC
  `,

  // Device & Time Analysis
  deviceTimeIntelligence: (dateRange = 'LAST_30_DAYS') => `
    SELECT 
      ${CORE_FIELDS.campaign.slice(1, 2).join(',\n      ')},
      ${SEGMENT_FIELDS.time.slice(0, 3).join(',\n      ')},
      ${SEGMENT_FIELDS.device.join(',\n      ')},
      ${METRIC_FIELDS.core.join(',\n      ')},
      ${METRIC_FIELDS.rates.slice(0, 2).join(',\n      ')}
    FROM campaign 
    WHERE segments.date DURING ${dateRange}
      AND metrics.impressions > 0
    ORDER BY segments.date DESC, segments.hour ASC
  `
};

// Helper functions for custom query building
export function buildSelectClause(fields) {
  return `SELECT \n  ${fields.join(',\n  ')}`;
}

export function buildFromClause(resource) {
  return `FROM ${resource}`;
}

export function buildWhereClause(conditions) {
  return conditions.length > 0 ? `WHERE ${conditions.join('\n  AND ')}` : '';
}

export function buildCustomQuery(fields, resource, conditions = [], orderBy = '') {
  const select = buildSelectClause(fields);
  const from = buildFromClause(resource);
  const where = buildWhereClause(conditions);
  const order = orderBy ? `ORDER BY ${orderBy}` : '';
  
  return [select, from, where, order].filter(clause => clause).join('\n');
}

// Commonly used field combinations
export const FIELD_COMBINATIONS = {
  // Basic campaign metrics
  basicCampaignMetrics: [
    ...CORE_FIELDS.campaign.slice(1, 3), // name, status
    ...METRIC_FIELDS.core,
    ...METRIC_FIELDS.rates.slice(0, 3) // ctr, cpc, cpm
  ],

  // Extended campaign metrics with segments
  extendedCampaignMetrics: [
    ...CORE_FIELDS.campaign.slice(1, 3),
    ...SEGMENT_FIELDS.time.slice(0, 1), // date
    ...SEGMENT_FIELDS.device.slice(0, 1), // device
    ...METRIC_FIELDS.core,
    ...METRIC_FIELDS.rates
  ],

  // Keyword performance fields
  keywordPerformanceFields: [
    ...CORE_FIELDS.campaign.slice(1, 2), // name only
    ...CORE_FIELDS.adGroup.slice(1, 2), // name only  
    ...CORE_FIELDS.keyword.slice(0, 3), // text, match_type, quality_score
    ...METRIC_FIELDS.core.slice(0, 4), // impressions, clicks, cost, conversions
    ...METRIC_FIELDS.rates.slice(0, 2) // ctr, cpc
  ],

  // Shopping performance fields
  shoppingPerformanceFields: [
    ...CORE_FIELDS.campaign.slice(1, 2),
    ...CORE_FIELDS.adGroup.slice(1, 2),
    ...CORE_FIELDS.shopping.slice(0, 4), // id, title, brand, category
    ...METRIC_FIELDS.core,
    ...METRIC_FIELDS.rates.slice(0, 2)
  ]
};

// Export default object with all exports
export default {
  CORE_FIELDS,
  SEGMENT_FIELDS,
  METRIC_FIELDS,
  QUERY_TEMPLATES,
  FIELD_COMBINATIONS,
  buildSelectClause,
  buildFromClause,
  buildWhereClause,
  buildCustomQuery
};
