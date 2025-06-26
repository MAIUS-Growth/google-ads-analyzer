// Add this import at the top of server.js (after your existing imports)
import SimpleAIMemory from './ai-memory.js';

// Add this after your client setup (around line 15)
const aiMemory = new SimpleAIMemory();
console.log('🧠 AI Memory System initialized');

// ==================== ENHANCED GOOGLE ADS INTELLIGENCE ENGINE ====================

class GoogleAdsIntelligenceEngine {
  constructor() {
    this.dataLayers = {
      // Core Resources
      account: 'customer',
      campaign: 'campaign',
      adGroup: 'ad_group', 
      ads: 'ad_group_ad',
      keywords: 'keyword_view',
      searchTerms: 'search_term_view',
      
      // Advanced Campaign Types
      performanceMax: 'asset_group',
      shopping: 'shopping_performance_view',
      video: 'video',
      app: 'campaign',
      local: 'campaign',
      discovery: 'campaign',
      smart: 'campaign',
      hotel: 'hotel_group_view',
      
      // Audience & Demographics
      audiences: 'audience_view',
      demographics: 'age_range_view',
      userLists: 'user_list',
      customAudiences: 'custom_audience',
      
      // Geographic & Placement
      locations: 'geographic_view',
      placements: 'detail_placement_view',
      managedPlacements: 'managed_placement_view',
      
      // Assets & Creative
      assets: 'asset',
      assetGroups: 'asset_group',
      assetGroupAssets: 'asset_group_asset',
      
      // Extensions & Features
      extensions: 'extension_feed_item',
      callouts: 'callout_feed_item',
      sitelinks: 'sitelink_feed_item',
      
      // Conversion & Attribution
      conversions: 'conversion_action',
      conversionCustomVariable: 'conversion_custom_variable',
      customerLifetime: 'customer_client',
      
      // Administrative
      changeHistory: 'change_event',
      recommendations: 'recommendation',
      policies: 'ad_group_ad_policy_summary',
      
      // Landing Pages & Quality
      landingPages: 'landing_page_view',
      expandedLandingPages: 'expanded_landing_page_view',
      
      // Product & Shopping
      productGroups: 'product_group_view',
      shoppingProducts: 'shopping_product_view',
      merchantCenter: 'merchant_center_link'
    };
  }

buildQuery(analysisType, dateRange = 'LAST_30_DAYS', filters = {}) {
  const queries = {
    // COMPLETE ACCOUNT OVERVIEW
    accountOverview: `
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.auto_tagging_enabled,
        customer.manager,
        customer.test_account
      FROM customer
    `,

    // COMPREHENSIVE CAMPAIGN INTELLIGENCE (FIXED FIELDS)
    campaignIntelligence: `
      SELECT 
        customer.id,
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.serving_status,
        campaign.advertising_channel_type,
        campaign.advertising_channel_sub_type,
        campaign.bidding_strategy_type,
        campaign.start_date,
        campaign.end_date,
        segments.date,
        segments.day_of_week,
        segments.hour,
        segments.device,
        segments.click_type,
        
        -- CORE METRICS (VALIDATED)
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.view_through_conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.average_cpm,
        metrics.cost_per_conversion,
        metrics.value_per_conversion
        
      FROM campaign 
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
    `,

    // IMPRESSION SHARE ANALYSIS (CORRECTED)
    impressionShareIntelligence: `
      SELECT 
        campaign.name,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.search_impression_share,
        metrics.search_budget_lost_impression_share,
        metrics.search_rank_lost_impression_share,
        metrics.search_exact_match_impression_share
      FROM campaign
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
        AND campaign.advertising_channel_type = 'SEARCH'
      ORDER BY metrics.search_impression_share DESC
    `,

    // SHOPPING INTELLIGENCE (FIXED FIELDS)
    shoppingIntelligence: `
      SELECT 
        campaign.name,
        ad_group.name,
        segments.product_item_id,
        segments.product_title,
        segments.product_brand,
        segments.product_category_level1,
        segments.product_category_level2,
        segments.product_category_level3,
        segments.product_condition,
        segments.product_country,
        segments.product_language,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM shopping_performance_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY metrics.conversions_value DESC
    `,

    // PERFORMANCE MAX (SIMPLIFIED TO AVOID ERRORS)
    performanceMaxIntelligence: `
      SELECT 
        campaign.name,
        campaign.advertising_channel_type,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING ${dateRange}
        AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
        AND metrics.impressions > 0
      ORDER BY metrics.conversions DESC
    `,

    // VIDEO INTELLIGENCE (SIMPLIFIED)
    videoIntelligence: `
      SELECT 
        campaign.name,
        ad_group.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.video_views,
        metrics.video_view_rate,
        metrics.average_cpv
      FROM ad_group_ad
      WHERE segments.date DURING ${dateRange}
        AND campaign.advertising_channel_type = 'VIDEO'
        AND metrics.impressions > 0
      ORDER BY metrics.video_views DESC
    `,

    // CUSTOMER LIFETIME VALUE (SIMPLIFIED)
    customerLifetimeValueIntelligence: `
      SELECT 
        campaign.name,
        segments.date,
        segments.new_versus_returning_customers,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_micros,
        metrics.clicks
      FROM campaign
      WHERE segments.date DURING ${dateRange}
        AND metrics.conversions > 0
      ORDER BY metrics.conversions_value DESC
    `,

    // ENHANCED SEARCH TERMS (WORKING VERSION)
    searchTermsIntelligence: `
      SELECT 
        search_term_view.search_term,
        search_term_view.status,
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        segments.date,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM search_term_view 
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY metrics.conversions_value DESC
    `,

    // GEOGRAPHIC INTELLIGENCE (SIMPLIFIED)
    locationIntelligence: `
      SELECT 
        campaign.name,
        ad_group.name,
        geographic_view.country_criterion_id,
        geographic_view.location_type,
        segments.geo_target_city,
        segments.geo_target_region,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM geographic_view 
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY metrics.conversions_value DESC
    `,

    // DEVICE & TIME ANALYSIS
    deviceTimeIntelligence: `
      SELECT 
        campaign.name,
        segments.date,
        segments.day_of_week,
        segments.hour,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign 
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions > 0
      ORDER BY segments.date DESC, segments.hour ASC
    `,

    // KEYWORD INTELLIGENCE (WORKING VERSION)
    keywordIntelligence: `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.status,
        segments.date,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.search_impression_share
      FROM keyword_view 
      WHERE segments.date DURING ${dateRange}
        AND ad_group_criterion.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
    `,

    // AD PERFORMANCE (WORKING VERSION)
    adIntelligence: `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.type,
        ad_group_ad.ad.expanded_text_ad.headline_part1,
        ad_group_ad.ad.expanded_text_ad.headline_part2,
        ad_group_ad.ad.expanded_text_ad.description,
        ad_group_ad.status,
        segments.date,
        segments.device,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad 
      WHERE segments.date DURING ${dateRange}
        AND ad_group_ad.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.conversions DESC
    `
  };

  return queries[analysisType] || queries.campaignIntelligence;
}

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Analysis helper methods
  static analyzeImpressionShare(campaignData) {
    const impressionShareMetrics = {
      search: { total: 0, budget_lost: 0, rank_lost: 0, exact_match: 0 },
      display: { total: 0, budget_lost: 0, rank_lost: 0 },
      overall: { campaigns: 0, avg_share: 0 }
    };

    let totalCampaigns = 0;
    let totalImpressionShare = 0;

    campaignData.forEach(row => {
      // Search impression share
      if (row.metrics?.search_impression_share) {
        impressionShareMetrics.search.total += row.metrics.search_impression_share;
        impressionShareMetrics.search.budget_lost += row.metrics?.search_budget_lost_impression_share || 0;
        impressionShareMetrics.search.rank_lost += row.metrics?.search_rank_lost_impression_share || 0;
        impressionShareMetrics.search.exact_match += row.metrics?.search_exact_match_impression_share || 0;
      }

      // Display impression share  
      if (row.metrics?.content_impression_share) {
        impressionShareMetrics.display.total += row.metrics.content_impression_share;
        impressionShareMetrics.display.budget_lost += row.metrics?.content_budget_lost_impression_share || 0;
        impressionShareMetrics.display.rank_lost += row.metrics?.content_rank_lost_impression_share || 0;
      }

      // Overall metrics
      if (row.metrics?.impression_share) {
        totalImpressionShare += row.metrics.impression_share;
        totalCampaigns++;
      }
    });

    return {
      searchImpressionShare: {
        avgShare: `${((impressionShareMetrics.search.total / campaignData.length) * 100).toFixed(1)}%`,
        budgetLoss: `${((impressionShareMetrics.search.budget_lost / campaignData.length) * 100).toFixed(1)}%`,
        rankLoss: `${((impressionShareMetrics.search.rank_lost / campaignData.length) * 100).toFixed(1)}%`,
        exactMatchShare: `${((impressionShareMetrics.search.exact_match / campaignData.length) * 100).toFixed(1)}%`
      },
      displayImpressionShare: {
        avgShare: `${((impressionShareMetrics.display.total / campaignData.length) * 100).toFixed(1)}%`,
        budgetLoss: `${((impressionShareMetrics.display.budget_lost / campaignData.length) * 100).toFixed(1)}%`,
        rankLoss: `${((impressionShareMetrics.display.rank_lost / campaignData.length) * 100).toFixed(1)}%`
      },
      overallShare: totalCampaigns > 0 ? `${((totalImpressionShare / totalCampaigns) * 100).toFixed(1)}%` : '0%',
      recommendations: this.generateImpressionShareRecommendations(impressionShareMetrics, campaignData.length)
    };
  }

  static generateImpressionShareRecommendations(metrics, campaignCount) {
    const recommendations = [];
    
    const avgBudgetLoss = (metrics.search.budget_lost / campaignCount) * 100;
    const avgRankLoss = (metrics.search.rank_lost / campaignCount) * 100;
    
    if (avgBudgetLoss > 20) {
      recommendations.push(`High budget loss (${avgBudgetLoss.toFixed(1)}%) - Consider increasing campaign budgets`);
    }
    
    if (avgRankLoss > 15) {
      recommendations.push(`High rank loss (${avgRankLoss.toFixed(1)}%) - Focus on improving Quality Score and bid competitiveness`);
    }
    
    if (avgBudgetLoss < 5 && avgRankLoss < 5) {
      recommendations.push('Strong impression share performance - Consider expanding reach or testing new markets');
    }
    
    return recommendations;
  }

static analyzeNewCustomerLTV(ltvData) {
  const customerSegments = {
    new: { conversions: 0, value: 0, spend: 0 },
    returning: { conversions: 0, value: 0, spend: 0 }
  };

  ltvData.forEach(row => {
    const segment = row.segments?.new_versus_returning_customers === 'NEW' ? 'new' : 'returning';
    
    customerSegments[segment].conversions += row.metrics?.conversions || 0;
    customerSegments[segment].value += row.metrics?.conversions_value || 0;
    customerSegments[segment].spend += (row.metrics?.cost_micros || 0) / 1000000;
  });

  return {
    newCustomers: {
      ...customerSegments.new,
      roas: customerSegments.new.spend > 0 ? 
        (customerSegments.new.value / customerSegments.new.spend).toFixed(2) : '0',
      avgOrderValue: customerSegments.new.conversions > 0 ? 
        (customerSegments.new.value / customerSegments.new.conversions).toFixed(2) : '0'
    },
    returningCustomers: {
      ...customerSegments.returning,
      roas: customerSegments.returning.spend > 0 ? 
        (customerSegments.returning.value / customerSegments.returning.spend).toFixed(2) : '0',
      avgOrderValue: customerSegments.returning.conversions > 0 ? 
        (customerSegments.returning.value / customerSegments.returning.conversions).toFixed(2) : '0'
    },
    insights: {
      newVsReturningPerformance: customerSegments.new.conversions > 0 && customerSegments.returning.conversions > 0 ? 
        `New customers have ${((customerSegments.new.value / customerSegments.new.conversions) / (customerSegments.returning.value / customerSegments.returning.conversions)).toFixed(1)}x AOV vs returning` : 
        'Insufficient data for comparison'
    }
  };
}

// Initialize the enhanced intelligence engine
const intelligenceEngine = new GoogleAdsIntelligenceEngine();
console.log('🧠 Enhanced Google Ads Intelligence Engine initialized');

// Complete Agency-Ready Google Ads API Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleAdsApi } from 'google-ads-api';

// Load environment variables
dotenv.config();

// Create the server
const app = express();
const PORT = process.env.PORT || 3001;

// Set up Google Ads client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Enhanced CORS for ChatGPT and agency use
app.use(cors({
  origin: [
    'https://chatgpt.com',
    'https://chat.openai.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// ==================== HELPER FUNCTIONS ====================

// Enhanced query executor with better error handling
async function executeGAQLQuery(query, customerId) {
  try {
    const cleanCustomerId = customerId.replace(/[-\s]/g, '');
    const managerCustomerId = '5672864299'; // Your manager account
    
    let customerConfig;
    if (cleanCustomerId === managerCustomerId) {
      customerConfig = {
        customer_id: cleanCustomerId,
        refresh_token: process.env.REFRESH_TOKEN,
      };
    } else {
      customerConfig = {
        customer_id: cleanCustomerId,
        login_customer_id: managerCustomerId,
        refresh_token: process.env.REFRESH_TOKEN,
      };
    }
    
    const customer = client.Customer(customerConfig);
    const result = await customer.query(query);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error(`Query failed for customer ${customerId}:`, error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return {
      success: false,
      error: error.message,
      details: error.failure?.errors || []
    };
  }
}

// Status converter
function getStatusText(status) {
  switch(status) {
    case 2: return 'ENABLED';
    case 3: return 'REMOVED'; 
    case 4: return 'PAUSED';
    default: return 'UNKNOWN';
  }
}

// Date range validator for agency use
function validateDateRange(period) {
  const validRanges = [
    'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS',
    'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER',
    'THIS_YEAR', 'LAST_YEAR', 'ALL_TIME'
  ];
  
  // Fix common mistakes
  if (period === 'LAST_90_DAYS') return 'THIS_QUARTER'; // Closest valid equivalent
  if (period === 'ALL_TIME') return 'THIS_YEAR'; // Use current year for "all time"
  
  return validRanges.includes(period) ? period : 'LAST_30_DAYS';
}

// ==================== BASIC ROUTES ====================

// Health check
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Agency Google Ads API Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/chatgpt/accounts - List all accounts',
      'GET /api/chatgpt/account/:id - Account overview',
      'GET /api/chatgpt/metrics - Flexible metrics',
      'GET /api/chatgpt/analysis/:id - Statistical analysis',
      'GET /api/chatgpt/keyword-analysis/:id - Keyword gap analysis',
      'GET /api/chatgpt/search-terms/:id - Search terms mining',
      'GET /api/chatgpt/ad-copy-analysis/:id - Ad copy performance',
      'GET /api/chatgpt/quality-score/:id - Quality Score analysis',
      'POST /api/execute-query - Custom GAQL queries'
    ]
  });
});

// Legacy query executor (for your existing frontend)
app.post('/api/execute-query', async (req, res) => {
  try {
    const { query, customerId } = req.body;
    
    console.log('Legacy query executed:', query);
    console.log('For customer ID:', customerId);
    
    if (!customerId) {
      return res.status(400).json({ 
        success: false,
        error: 'Customer ID is required' 
      });
    }
    
    const result = await executeGAQLQuery(query, customerId);
    
    if (result.success) {
      console.log(`Query executed successfully. ${result.data.length} rows returned.`);
      res.json({
        success: true,
        data: result.data,
        rowCount: result.data.length
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('Error executing legacy query:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== CHATGPT INTEGRATION ROUTES ====================

// Enhanced: Get ALL your MCC accounts (with fixed error handling)
app.get('/api/chatgpt/accounts', async (req, res) => {
  try {
    console.log('ChatGPT requested account list - loading all MCC accounts');
    
    // ALL your actual account IDs from MCC + manager account
    const knownAccounts = [
      '567-286-4299',    // Your manager account (MCC)
      '852-070-8211',
      '998-480-7723',
      '498-931-0941',
      '798-101-9658',
      '884-091-7486',
      '735-725-8958',
      '256-530-5911',
      '796-673-9288',
      '511-562-4109',
      '396-211-6392',
      '443-339-7750',
      '233-304-0768',
      '533-365-4586',
      '781-020-0542',
      '552-675-5067',
      '291-914-6712',
      '148-160-0039',
      '464-650-0984',
      '494-589-7843',    // Your main test account
      '146-144-1066',
      '211-951-9725'
    ];
    
    const accountDetails = [];
    let successCount = 0;
    
    console.log(`Processing ${knownAccounts.length} accounts...`);
    
    for (const accountId of knownAccounts) {
      try {
        const cleanCustomerId = accountId.replace(/[-\s]/g, '');
        const managerCustomerId = '5672864299';
        
        let customerConfig;
        if (cleanCustomerId === managerCustomerId) {
          customerConfig = {
            customer_id: cleanCustomerId,
            refresh_token: process.env.REFRESH_TOKEN,
          };
        } else {
          customerConfig = {
            customer_id: cleanCustomerId,
            login_customer_id: managerCustomerId,
            refresh_token: process.env.REFRESH_TOKEN,
          };
        }
        
        const customer = client.Customer(customerConfig);
        
        // Get customer details
        const customerQuery = `
          SELECT 
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone,
            customer.manager
          FROM customer
          LIMIT 1
        `;
        
        const customerInfo = await customer.query(customerQuery);
        
        if (customerInfo && customerInfo.length > 0) {
          const info = customerInfo[0].customer;
          
          // Get campaign count and recent spend
          const campaignQuery = `
            SELECT 
              campaign.id,
              campaign.status,
              metrics.cost_micros
            FROM campaign 
            WHERE segments.date DURING LAST_30_DAYS
            LIMIT 100
          `;
          
          let campaignCount = 0;
          let monthlySpend = 0;
          let activeCampaigns = 0;
          
          try {
            const campaigns = await customer.query(campaignQuery);
            campaignCount = campaigns.length;
            activeCampaigns = campaigns.filter(c => c.campaign?.status === 2).length;
            monthlySpend = campaigns.reduce((sum, c) => sum + (c.metrics?.cost_micros || 0), 0) / 1000000;
          } catch (e) {
            console.log(`Campaign data unavailable for ${accountId}`);
          }
          
          accountDetails.push({
            id: accountId,
            name: info.descriptive_name || `Account ${accountId}`,
            type: info.manager ? "manager" : "client",
            currency: info.currency_code || "USD",
            timeZone: info.time_zone || "Unknown",
            totalCampaigns: campaignCount,
            activeCampaigns: activeCampaigns,
            monthlySpend: `$${monthlySpend.toFixed(2)}`,
            description: info.manager 
              ? "Manager account (MCC)" 
              : `${activeCampaigns}/${campaignCount} active campaigns, $${monthlySpend.toFixed(2)} monthly spend`,
            status: "accessible"
          });
          
          successCount++;
          console.log(`✅ Loaded: ${info.descriptive_name} (${accountId})`);
        }
        
      } catch (accountError) {
        console.log(`⚠️ Cannot access account ${accountId}:`, accountError);
        
        // Fixed error handling
        const errorMessage = accountError?.message || accountError?.toString() || 'Unknown error';
        
        // Add basic info for inaccessible accounts
        accountDetails.push({
          id: accountId,
          name: `Account ${accountId}`,
          type: accountId === '567-286-4299' ? "manager" : "client",
          currency: "USD",
          timeZone: "Unknown",
          totalCampaigns: 0,
          activeCampaigns: 0,
          monthlySpend: "$0.00",
          description: "Account access limited",
          status: "limited",
          error: errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage
        });
      }
    }
    
    // Sort accounts - manager first, then by monthly spend (highest first)
    accountDetails.sort((a, b) => {
      if (a.type === 'manager' && b.type !== 'manager') return -1;
      if (b.type === 'manager' && a.type !== 'manager') return 1;
      
      const spendA = parseFloat(a.monthlySpend.replace('$', ''));
      const spendB = parseFloat(b.monthlySpend.replace('$', ''));
      return spendB - spendA; // Highest spend first
    });
    
    const totalSpend = accountDetails
      .filter(a => a.status === 'accessible')
      .reduce((sum, a) => sum + parseFloat(a.monthlySpend.replace('$', '')), 0);
    
    res.json({
      success: true,
      accounts: accountDetails,
      summary: {
        totalAccounts: accountDetails.length,
        accessibleAccounts: successCount,
        limitedAccounts: accountDetails.length - successCount,
        totalMonthlySpend: `$${totalSpend.toFixed(2)}`,
        managedClients: accountDetails.filter(a => a.type === 'client' && a.status === 'accessible').length
      },
      message: `Loaded ${successCount}/${knownAccounts.length} accounts from your MCC`,
      note: "Accounts sorted by monthly spend (highest first)"
    });
    
  } catch (error) {
    console.error('Error loading MCC accounts:', error);
    res.status(500).json({ 
      error: error.message,
      fallback: "Could not load MCC accounts"
    });
  }
});

// 2. Comprehensive account overview with flexible date ranges
app.get('/api/chatgpt/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Account analysis requested: ${accountId}, period: ${validPeriod}`);
    
    const campaignQuery = `
      SELECT 
        campaign.name, 
        campaign.status, 
        metrics.clicks, 
        metrics.impressions, 
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
      ORDER BY metrics.cost_micros DESC
    `;
    
    const result = await executeGAQLQuery(campaignQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const campaignData = result.data;
    
    // Calculate comprehensive metrics
    const totalClicks = campaignData.reduce((sum, row) => sum + (row.metrics?.clicks || 0), 0);
    const totalImpressions = campaignData.reduce((sum, row) => sum + (row.metrics?.impressions || 0), 0);
    const totalCost = campaignData.reduce((sum, row) => sum + (row.metrics?.cost_micros || 0), 0) / 1000000;
    const totalConversions = campaignData.reduce((sum, row) => sum + (row.metrics?.conversions || 0), 0);
    const totalConversionsValue = campaignData.reduce((sum, row) => sum + (row.metrics?.conversions_value || 0), 0);
    
    const overview = {
      accountId: accountId,
      period: validPeriod.replace(/_/g, ' ').toLowerCase(),
      summary: {
        totalCampaigns: campaignData.length,
        activeCampaigns: campaignData.filter(c => c.campaign?.status === 2).length,
        totalClicks: totalClicks,
        totalImpressions: totalImpressions,
        totalSpend: `$${totalCost.toFixed(2)}`,
        totalConversions: totalConversions,
        conversionValue: `$${totalConversionsValue.toFixed(2)}`,
        averageCTR: totalImpressions > 0 ? `${(totalClicks / totalImpressions * 100).toFixed(2)}%` : "0%",
        averageCPC: totalClicks > 0 ? `$${(totalCost / totalClicks).toFixed(2)}` : "$0.00",
        roas: totalCost > 0 ? (totalConversionsValue / totalCost).toFixed(2) : "0.00"
      },
      campaigns: campaignData.map(campaign => ({
        name: campaign.campaign?.name,
        status: getStatusText(campaign.campaign?.status),
        clicks: campaign.metrics?.clicks || 0,
        impressions: campaign.metrics?.impressions || 0,
        spend: `$${((campaign.metrics?.cost_micros || 0) / 1000000).toFixed(2)}`,
        conversions: campaign.metrics?.conversions || 0,
        ctr: `${((campaign.metrics?.ctr || 0) * 100).toFixed(2)}%`,
        cpc: `$${((campaign.metrics?.average_cpc || 0) / 1000000).toFixed(2)}`,
        conversionRate: `${((campaign.metrics?.clicks || 0) > 0 ? ((campaign.metrics?.conversions || 0) / (campaign.metrics?.clicks || 0) * 100).toFixed(2) : '0.00')}%`
      }))
    };
    
    res.json({
      success: true,
      overview: overview
    });
    
  } catch (error) {
    console.error('Error getting account overview:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 3. Flexible metrics with multiple date range support
app.get('/api/chatgpt/metrics', async (req, res) => {
  try {
    const { accountId = "494-589-7843", period = "LAST_30_DAYS" } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Metrics requested: ${accountId}, period: ${validPeriod}`);
    
    const metricsQuery = `
      SELECT 
        campaign.name,
        campaign.status,
        metrics.clicks,
        metrics.impressions, 
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
      ORDER BY metrics.cost_micros DESC
    `;
    
    const result = await executeGAQLQuery(metricsQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const processedMetrics = result.data.map(row => ({
      campaign: row.campaign?.name,
      status: getStatusText(row.campaign?.status),
      clicks: row.metrics?.clicks || 0,
      impressions: row.metrics?.impressions || 0,
      spend: `$${((row.metrics?.cost_micros || 0) / 1000000).toFixed(2)}`,
      conversions: row.metrics?.conversions || 0,
      ctr: `${((row.metrics?.ctr || 0) * 100).toFixed(2)}%`,
      cpc: `$${((row.metrics?.average_cpc || 0) / 1000000).toFixed(2)}`,
      conversionRate: `${((row.metrics?.clicks || 0) > 0 ? ((row.metrics?.conversions || 0) / (row.metrics?.clicks || 0) * 100).toFixed(2) : '0.00')}%`
    }));
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod.replace(/_/g, ' ').toLowerCase(),
      metrics: processedMetrics,
      totalCampaigns: processedMetrics.length
    });
    
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 4. SMART Statistical analysis - only suggests what's actually needed
app.get('/api/chatgpt/analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS', confidenceLevel = '90' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Smart analysis requested: ${accountId}, period: ${validPeriod}, confidence: ${confidenceLevel}%`);
    
    const analysisQuery = `
      SELECT 
        campaign.name,
        segments.date,
        segments.day_of_week,
        segments.hour,
        segments.device,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
        AND metrics.impressions > 0
      ORDER BY segments.date DESC
    `;
    
    const result = await executeGAQLQuery(analysisQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Smart analysis with conditional insights
    const dayPerformance = {};
    const devicePerformance = {};
    const hourPerformance = {};
    let totalSpend = 0;
    let totalConversions = 0;
    let totalClicks = 0;
    
    result.data.forEach(row => {
      const day = row.segments?.day_of_week || 'UNKNOWN';
      const device = row.segments?.device || 'UNKNOWN';
      const hour = row.segments?.hour || 'UNKNOWN';
      const spend = (row.metrics?.cost_micros || 0) / 1000000;
      const conversions = row.metrics?.conversions || 0;
      const clicks = row.metrics?.clicks || 0;
      const impressions = row.metrics?.impressions || 0;
      
      totalSpend += spend;
      totalConversions += conversions;
      totalClicks += clicks;
      
      // Day analysis
      if (!dayPerformance[day]) {
        dayPerformance[day] = { spend: 0, conversions: 0, clicks: 0, impressions: 0, sessions: 0 };
      }
      dayPerformance[day].spend += spend;
      dayPerformance[day].conversions += conversions;
      dayPerformance[day].clicks += clicks;
      dayPerformance[day].impressions += impressions;
      dayPerformance[day].sessions += 1;
      
      // Device analysis
      if (!devicePerformance[device]) {
        devicePerformance[device] = { spend: 0, conversions: 0, clicks: 0, impressions: 0, sessions: 0 };
      }
      devicePerformance[device].spend += spend;
      devicePerformance[device].conversions += conversions;
      devicePerformance[device].clicks += clicks;
      devicePerformance[device].impressions += impressions;
      devicePerformance[device].sessions += 1;
      
      // Hour analysis
      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { spend: 0, conversions: 0, clicks: 0, sessions: 0 };
      }
      hourPerformance[hour].spend += spend;
      hourPerformance[hour].conversions += conversions;
      hourPerformance[hour].clicks += clicks;
      hourPerformance[hour].sessions += 1;
    });
    
    // SMART INSIGHTS - Only suggest what's actually needed
    const insights = [];
    const accountAvgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
    const accountAvgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    
    // 1. DAYPARTING - Only if there's significant variation AND enough data
    const dayVariations = Object.keys(dayPerformance).map(day => {
      const dayData = dayPerformance[day];
      const conversionRate = dayData.clicks > 0 ? dayData.conversions / dayData.clicks : 0;
      const cpc = dayData.clicks > 0 ? dayData.spend / dayData.clicks : 0;
      return {
        day,
        conversionRate,
        cpc,
        spend: dayData.spend,
        clicks: dayData.clicks,
        sessions: dayData.sessions
      };
    }).filter(d => d.clicks > 20); // Only days with meaningful data
    
    if (dayVariations.length >= 5) { // Need at least 5 days of data
      const bestDay = dayVariations.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      const worstDay = dayVariations.reduce((worst, current) => 
        current.conversionRate < worst.conversionRate ? current : worst
      );
      
      const conversionRateGap = bestDay.conversionRate - worstDay.conversionRate;
      
      // Only suggest dayparting if there's a >50% difference in conversion rates
      if (conversionRateGap > accountAvgConversionRate * 0.5 && bestDay.conversionRate > accountAvgConversionRate * 1.2) {
        insights.push({
          type: 'Dayparting Opportunity',
          priority: 'High',
          description: `${bestDay.day} shows ${(bestDay.conversionRate * 100).toFixed(1)}% conversion rate vs ${(worstDay.conversionRate * 100).toFixed(1)}% on ${worstDay.day}. This ${((conversionRateGap / accountAvgConversionRate) * 100).toFixed(0)}% performance gap justifies dayparting optimization.`,
          impact: `Potential +${((conversionRateGap * bestDay.clicks * 30)).toFixed(0)} conversions/month`,
          confidence: `${confidenceLevel}%`,
          action: `Increase bids +20% on ${bestDay.day}, decrease -15% on ${worstDay.day}`,
          dataPoints: dayVariations.length
        });
      }
    }
    
    // 2. DEVICE OPTIMIZATION - Only if there's meaningful performance difference
    const deviceVariations = Object.keys(devicePerformance).map(device => {
      const deviceData = devicePerformance[device];
      const conversionRate = deviceData.clicks > 0 ? deviceData.conversions / deviceData.clicks : 0;
      const cpc = deviceData.clicks > 0 ? deviceData.spend / deviceData.clicks : 0;
      const roas = deviceData.spend > 0 ? (deviceData.conversions * 100) / deviceData.spend : 0; // Assuming $100 avg conversion value
      return {
        device,
        conversionRate,
        cpc,
        roas,
        spend: deviceData.spend,
        clicks: deviceData.clicks
      };
    }).filter(d => d.clicks > 50); // Only devices with meaningful data
    
    if (deviceVariations.length >= 2) {
      const bestDevice = deviceVariations.reduce((best, current) => 
        current.roas > best.roas ? current : best
      );
      const worstDevice = deviceVariations.reduce((worst, current) => 
        current.roas < worst.roas ? current : worst
      );
      
      // Only suggest device optimization if there's >30% ROAS difference
      if (bestDevice.roas > worstDevice.roas * 1.3 && bestDevice.spend > totalSpend * 0.1) {
        insights.push({
          type: 'Device Bid Optimization',
          priority: bestDevice.roas > worstDevice.roas * 1.5 ? 'High' : 'Medium',
          description: `${bestDevice.device} delivers ${bestDevice.roas.toFixed(1)}x ROAS vs ${worstDevice.roas.toFixed(1)}x on ${worstDevice.device}. Device performance gap justifies bid adjustments.`,
          impact: `Potential savings: $${(worstDevice.spend * 0.2).toFixed(0)}/month`,
          confidence: `${confidenceLevel}%`,
          action: `Increase ${bestDevice.device} bids +15%, decrease ${worstDevice.device} bids -20%`,
          currentSpendSplit: `${bestDevice.device}: $${bestDevice.spend.toFixed(0)}, ${worstDevice.device}: $${worstDevice.spend.toFixed(0)}`
        });
      }
    }
    
    // 3. BUDGET ALLOCATION - Only if there are clear winners/losers
    const campaignPerformance = {};
    result.data.forEach(row => {
      const campaign = row.campaign?.name || 'Unknown';
      if (!campaignPerformance[campaign]) {
        campaignPerformance[campaign] = { spend: 0, conversions: 0, clicks: 0 };
      }
      campaignPerformance[campaign].spend += (row.metrics?.cost_micros || 0) / 1000000;
      campaignPerformance[campaign].conversions += row.metrics?.conversions || 0;
      campaignPerformance[campaign].clicks += row.metrics?.clicks || 0;
    });
    
    const campaignROAS = Object.keys(campaignPerformance).map(campaign => {
      const data = campaignPerformance[campaign];
      const roas = data.spend > 0 ? (data.conversions * 100) / data.spend : 0;
      const conversionRate = data.clicks > 0 ? data.conversions / data.clicks : 0;
      return {
        campaign,
        roas,
        conversionRate,
        spend: data.spend,
        conversions: data.conversions
      };
    }).filter(c => c.spend > totalSpend * 0.05); // Only campaigns with >5% of spend
    
    if (campaignROAS.length >= 2) {
      const topCampaign = campaignROAS.reduce((best, current) => 
        current.roas > best.roas ? current : best
      );
      const bottomCampaign = campaignROAS.reduce((worst, current) => 
        current.roas < worst.roas ? current : worst
      );
      
      // Only suggest budget reallocation if there's >2x ROAS difference
      if (topCampaign.roas > bottomCampaign.roas * 2 && bottomCampaign.spend > totalSpend * 0.1) {
        insights.push({
          type: 'Budget Reallocation',
          priority: 'High',
          description: `"${topCampaign.campaign}" delivers ${topCampaign.roas.toFixed(1)}x ROAS while "${bottomCampaign.campaign}" only achieves ${bottomCampaign.roas.toFixed(1)}x. Significant budget reallocation opportunity.`,
          impact: `Potential revenue increase: +$${((topCampaign.roas - bottomCampaign.roas) * bottomCampaign.spend * 0.5).toFixed(0)}/month`,
          confidence: `${confidenceLevel}%`,
          action: `Shift 25% of budget from "${bottomCampaign.campaign}" to "${topCampaign.campaign}"`,
          currentAllocation: `Top: $${topCampaign.spend.toFixed(0)}, Bottom: $${bottomCampaign.spend.toFixed(0)}`
        });
      }
    }
    
    // 4. PERFORMANCE HEALTH CHECK - Account-specific issues
    const overallCTR = result.data.reduce((sum, row) => sum + (row.metrics?.ctr || 0), 0) / result.data.length;
    const overallConversionRate = accountAvgConversionRate;
    
    if (overallCTR < 0.02) { // CTR below 2%
      insights.push({
        type: 'CTR Optimization',
        priority: 'Medium',
        description: `Account CTR of ${(overallCTR * 100).toFixed(2)}% is below industry average. Ad copy and keyword relevance need improvement.`,
        impact: `Improving CTR to 3% could reduce CPC by ~20%`,
        confidence: `85%`,
        action: `Focus on ad copy testing and negative keyword cleanup`,
        benchmark: `Industry average: 2-3% CTR`
      });
    }
    
    if (overallConversionRate < 0.01 && totalSpend > 1000) { // Low conversion rate on meaningful spend
      insights.push({
        type: 'Conversion Rate Optimization',
        priority: 'High',
        description: `Conversion rate of ${(overallConversionRate * 100).toFixed(2)}% is critically low for $${totalSpend.toFixed(0)} monthly spend. Landing page optimization required.`,
        impact: `Doubling conversion rate would double ROI`,
        confidence: `95%`,
        action: `Audit landing pages, improve page speed, and test clearer CTAs`,
        urgency: `Critical - high spend with poor conversions`
      });
    }
    
    // If no insights, provide account health summary
    if (insights.length === 0) {
      insights.push({
        type: 'Account Health',
        priority: 'Info',
        description: `Account shows consistent performance across time periods and devices. No major optimization gaps detected.`,
        impact: `Focus on incremental improvements and testing`,
        confidence: `${confidenceLevel}%`,
        action: `Continue current strategy with ongoing A/B testing`,
        note: `Well-optimized account - consider expansion opportunities`
      });
    }
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      confidenceLevel: `${confidenceLevel}%`,
      analysis: {
        summary: {
          totalSpend: `$${totalSpend.toFixed(2)}`,
          totalConversions: totalConversions,
          overallConversionRate: `${(overallConversionRate * 100).toFixed(2)}%`,
          avgCPC: `$${accountAvgCPC.toFixed(2)}`,
          dataQuality: result.data.length > 100 ? 'High' : result.data.length > 30 ? 'Medium' : 'Low'
        },
        dayOfWeekPerformance: dayPerformance,
        devicePerformance: devicePerformance,
        hourlyPerformance: hourPerformance,
        insights: insights,
        totalDataPoints: result.data.length,
        analysisDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in smart statistical analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Keyword gap analysis
app.get('/api/chatgpt/keyword-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Keyword analysis requested: ${accountId}, period: ${validPeriod}`);
    
const keywordQuery = `
  SELECT 
    ad_group_criterion.keyword.text,
    ad_group_criterion.keyword.match_type,
    campaign.name,
    ad_group.name,
    metrics.clicks,
    metrics.impressions,
    metrics.cost_micros,
    metrics.conversions,
    metrics.ctr,
    metrics.search_impression_share
  FROM keyword_view 
  WHERE segments.date DURING ${validPeriod}
    AND ad_group_criterion.status = 'ENABLED'
    AND metrics.impressions > 0
  ORDER BY metrics.cost_micros DESC
  LIMIT 300
`;
    
    const result = await executeGAQLQuery(keywordQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const keywords = result.data.map(kw => ({
  keyword: kw.ad_group_criterion?.keyword?.text,
  matchType: kw.ad_group_criterion?.keyword?.match_type,
  campaign: kw.campaign?.name,
  adGroup: kw.ad_group?.name,
  spend: (kw.metrics?.cost_micros || 0) / 1000000,
  conversions: kw.metrics?.conversions || 0,
  clicks: kw.metrics?.clicks || 0,
  impressions: kw.metrics?.impressions || 0,
  ctr: (kw.metrics?.ctr || 0) * 100,
  impressionShare: (kw.metrics?.search_impression_share || 0) * 100,
  qualityScore: 'See Quality Score endpoint', // Not available in keyword_view
  conversionRate: (kw.metrics?.clicks || 0) > 0 ? (kw.metrics?.conversions || 0) / (kw.metrics?.clicks || 0) * 100 : 0
}));
    
    // Advanced keyword analysis
    const topPerformers = keywords
      .filter(kw => kw.conversionRate > 2 && kw.spend > 50)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 15);
    
    const underperformers = keywords
      .filter(kw => kw.conversionRate < 0.5 && kw.spend > 100)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15);
    
    const expansionOpportunities = keywords
      .filter(kw => kw.impressionShare > 50 && kw.conversionRate > 1 && kw.spend < 1000)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 15);
    
    const qualityScoreIssues = keywords
      .filter(kw => kw.qualityScore > 0 && kw.qualityScore < 6 && kw.spend > 50)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      keywordAnalysis: {
        totalKeywords: keywords.length,
        topPerformers: topPerformers,
        underperformers: underperformers,
        expansionOpportunities: expansionOpportunities,
        qualityScoreIssues: qualityScoreIssues,
        averageQualityScore: keywords.filter(k => k.qualityScore > 0).reduce((sum, k) => sum + k.qualityScore, 0) / keywords.filter(k => k.qualityScore > 0).length || 0
      }
    });
    
  } catch (error) {
    console.error('Error in keyword analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Search terms mining
app.get('/api/chatgpt/search-terms/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Search terms analysis requested: ${accountId}, period: ${validPeriod}`);
    
    const searchTermsQuery = `
      SELECT 
        search_term_view.search_term,
        search_term_view.status,
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view 
      WHERE segments.date DURING ${validPeriod}
        AND metrics.impressions > 3
      ORDER BY metrics.cost_micros DESC
      LIMIT 500
    `;
    
    const result = await executeGAQLQuery(searchTermsQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const newKeywordOpportunities = [];
    const negativeKeywordRecommendations = [];
    const brandProtection = [];
    
    result.data.forEach(term => {
      const searchTerm = term.search_term_view?.search_term?.toLowerCase() || '';
      const conversions = term.metrics?.conversions || 0;
      const clicks = term.metrics?.clicks || 0;
      const spend = (term.metrics?.cost_micros || 0) / 1000000;
      const conversionRate = clicks > 0 ? conversions / clicks * 100 : 0;
      
      // High-value search terms for new keywords
      if (conversionRate > 2 && clicks > 3 && spend > 10) {
        newKeywordOpportunities.push({
          searchTerm: searchTerm,
          triggeringKeyword: term.ad_group_criterion?.keyword?.text,
          matchType: term.ad_group_criterion?.keyword?.match_type,
          conversions: conversions,
          conversionRate: `${conversionRate.toFixed(2)}%`,
          spend: `$${spend.toFixed(2)}`,
          recommendation: 'Add as exact match keyword',
          priority: conversionRate > 5 ? 'High' : 'Medium'
        });
      }
      
      // Negative keyword opportunities
      if (spend > 20 && conversions === 0 && clicks > 3) {
        negativeKeywordRecommendations.push({
          searchTerm: searchTerm,
          triggeringKeyword: term.ad_group_criterion?.keyword?.text,
          wastedSpend: `$${spend.toFixed(2)}`,
          clicks: clicks,
          recommendation: 'Add as negative keyword',
          priority: spend > 100 ? 'High' : 'Medium'
        });
      }
      
      // Brand protection analysis
      const competitorKeywords = ['competitor', 'alternative', 'vs', 'review', 'compare'];
      if (competitorKeywords.some(word => searchTerm.includes(word))) {
        brandProtection.push({
          searchTerm: searchTerm,
          spend: `$${spend.toFixed(2)}`,
          conversions: conversions,
          recommendation: 'Review brand protection strategy'
        });
      }
    });
    
    const totalWastedSpend = negativeKeywordRecommendations.reduce((sum, item) => 
      sum + parseFloat(item.wastedSpend.replace('$', '')), 0
    );
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      searchTermAnalysis: {
        totalSearchTerms: result.data.length,
        newKeywordOpportunities: newKeywordOpportunities.slice(0, 20),
        negativeKeywordRecommendations: negativeKeywordRecommendations.slice(0, 20),
        brandProtection: brandProtection.slice(0, 10),
        potentialSavings: `$${totalWastedSpend.toFixed(2)}`,
        potentialRevenue: `$${newKeywordOpportunities.reduce((sum, item) => sum + parseFloat(item.spend.replace('$', '')), 0).toFixed(2)}`
      }
    });
    
  } catch (error) {
    console.error('Error in search terms analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Ad copy performance analysis (FIXED)
app.get('/api/chatgpt/ad-copy-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Ad copy analysis requested: ${accountId}, period: ${validPeriod}`);
    
    const adCopyQuery = `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.expanded_text_ad.headline_part1,
        ad_group_ad.ad.expanded_text_ad.headline_part2,
        ad_group_ad.ad.expanded_text_ad.description,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.status,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM ad_group_ad 
      WHERE segments.date DURING ${validPeriod}
        AND ad_group_ad.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.conversions DESC, metrics.clicks DESC
      LIMIT 100
    `;
    
    const result = await executeGAQLQuery(adCopyQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const adAnalysis = result.data.map(ad => {
      const clicks = ad.metrics?.clicks || 0;
      const impressions = ad.metrics?.impressions || 0;
      const conversions = ad.metrics?.conversions || 0;
      const spend = (ad.metrics?.cost_micros || 0) / 1000000;
      
      // Extract headlines and descriptions
      let headlines = [];
      let descriptions = [];
      
      if (ad.ad_group_ad?.ad?.expanded_text_ad) {
        headlines = [
          ad.ad_group_ad.ad.expanded_text_ad.headline_part1,
          ad.ad_group_ad.ad.expanded_text_ad.headline_part2
        ].filter(h => h);
        descriptions = [ad.ad_group_ad.ad.expanded_text_ad.description].filter(d => d);
      } else if (ad.ad_group_ad?.ad?.responsive_search_ad) {
        headlines = (ad.ad_group_ad.ad.responsive_search_ad.headlines || []).map(h => h.text).slice(0, 3);
        descriptions = (ad.ad_group_ad.ad.responsive_search_ad.descriptions || []).map(d => d.text).slice(0, 2);
      }
      
      // Calculate conversion rate manually
      const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
      
      return {
        campaign: ad.campaign?.name,
        adGroup: ad.ad_group?.name,
        headlines: headlines,
        descriptions: descriptions,
        performance: {
          clicks: clicks,
          impressions: impressions,
          conversions: conversions,
          spend: `$${spend.toFixed(2)}`,
          ctr: `${((ad.metrics?.ctr || 0) * 100).toFixed(2)}%`,
          conversionRate: `${conversionRate.toFixed(2)}%`,
          costPerConversion: conversions > 0 ? `$${(spend / conversions).toFixed(2)}` : 'N/A'
        }
      };
    });
    
    const topPerformers = adAnalysis
      .filter(ad => ad.performance.conversions > 0)
      .sort((a, b) => parseFloat(b.performance.conversionRate) - parseFloat(a.performance.conversionRate))
      .slice(0, 10);
    
    const lowPerformers = adAnalysis
      .filter(ad => parseFloat(ad.performance.spend.replace('$', '')) > 50 && ad.performance.conversions === 0)
      .sort((a, b) => parseFloat(b.performance.spend.replace('$', '')) - parseFloat(a.performance.spend.replace('$', '')))
      .slice(0, 10);
    
    // Copy recommendations
    const copyRecommendations = [
      "Test emotional headlines (save, free, guaranteed) on low-performing ads",
      "Add urgency elements ('Today Only', 'Limited Time') to increase CTR",
      "Include specific benefits and numbers in descriptions",
      "Test stronger call-to-action phrases ('Get Started Today', 'Claim Your Discount')",
      "Use responsive search ads with 15 headlines and 4 descriptions for optimal testing",
      "Add location-specific headlines if targeting local markets"
    ];
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      analysis: {
        totalAds: adAnalysis.length,
        topPerformers: topPerformers,
        lowPerformers: lowPerformers,
        copyRecommendations: copyRecommendations,
        testingOpportunities: adAnalysis.filter(ad => ad.headlines.length < 3).length
      }
    });
    
  } catch (error) {
    console.error('Error in ad copy analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Quality Score analysis
app.get('/api/chatgpt/quality-score/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    console.log(`Quality Score analysis requested: ${accountId}`);
    
    const qualityScoreQuery = `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.average_cpc
      FROM keyword_view 
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group_criterion.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY ad_group_criterion.quality_info.quality_score ASC, metrics.cost_micros DESC
      LIMIT 100
    `;
    
    const result = await executeGAQLQuery(qualityScoreQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const validKeywords = result.data.filter(kw => kw.ad_group_criterion?.quality_info?.quality_score);
    
    if (validKeywords.length === 0) {
      return res.json({ 
        success: true,
        message: "No Quality Score data available for the selected period",
        accountId: accountId
      });
    }
    
    const qualityScores = validKeywords.map(kw => kw.ad_group_criterion.quality_info.quality_score);
    const avgQualityScore = qualityScores.reduce((sum, qs) => sum + qs, 0) / qualityScores.length;
    
    const lowQualityKeywords = validKeywords
      .filter(kw => kw.ad_group_criterion.quality_info.quality_score <= 5)
      .map(kw => ({
        keyword: kw.ad_group_criterion?.keyword?.text,
        matchType: kw.ad_group_criterion?.keyword?.match_type,
        campaign: kw.campaign?.name,
        adGroup: kw.ad_group?.name,
        qualityScore: kw.ad_group_criterion.quality_info.quality_score,
        creativeQuality: kw.ad_group_criterion.quality_info.creative_quality_score,
        landingPageQuality: kw.ad_group_criterion.quality_info.post_click_quality_score,
        expectedCTR: kw.ad_group_criterion.quality_info.search_predicted_ctr,
        spend: `$${((kw.metrics?.cost_micros || 0) / 1000000).toFixed(2)}`,
        avgCPC: `$${((kw.metrics?.average_cpc || 0) / 1000000).toFixed(2)}`,
        recommendations: generateQSRecommendations(kw.ad_group_criterion.quality_info)
      }))
      .sort((a, b) => parseFloat(b.spend.replace('$', '')) - parseFloat(a.spend.replace('$', '')))
      .slice(0, 20);
    
    res.json({
      success: true,
      accountId: accountId,
      qualityScoreAnalysis: {
        summary: {
          averageQualityScore: avgQualityScore.toFixed(1),
          totalKeywords: validKeywords.length,
          lowQualityCount: lowQualityKeywords.length,
          potentialSavings: `$${lowQualityKeywords.reduce((sum, kw) => sum + parseFloat(kw.spend.replace('$', '')), 0).toFixed(2)}`
        },
        lowQualityKeywords: lowQualityKeywords,
        recommendations: [
          "Focus on keywords with QS ≤5 and high spend first",
          "Improve ad relevance by including target keywords in headlines",
          "Optimize landing pages for mobile experience and speed",
          "Use tighter keyword grouping for better ad relevance",
          "Add negative keywords to improve CTR and relevance"
        ]
      }
    });
    
  } catch (error) {
    console.error('Error in Quality Score analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

function generateQSRecommendations(qualityInfo) {
  const recommendations = [];
  
  if (qualityInfo.creative_quality_score === 'BELOW_AVERAGE') {
    recommendations.push('Improve ad relevance - include target keyword in headline');
  }
  if (qualityInfo.post_click_quality_score === 'BELOW_AVERAGE') {
    recommendations.push('Optimize landing page relevance and mobile experience');
  }
  if (qualityInfo.search_predicted_ctr === 'BELOW_AVERAGE') {
    recommendations.push('Improve expected CTR through better ad copy and extensions');
  }
  
  return recommendations.length > 0 ? recommendations : ['Monitor performance and continue testing'];
}
// ==================== AI LEARNING ROUTES ====================

// Store a recommendation (when GPT makes a suggestion)
app.post('/api/ai/store-recommendation', async (req, res) => {
  try {
    const { accountId, recommendation } = req.body;
    
    console.log(`🤖 GPT made recommendation for ${accountId}:`, recommendation);
    
    const recommendationId = await aiMemory.storeRecommendation(accountId, recommendation);
    
    res.json({
      success: true,
      recommendationId: recommendationId,
      message: `Recommendation stored. I'll learn from the results!`,
      nextSteps: `Monitor performance for 30 days, then update me with results`
    });
    
  } catch (error) {
    console.error('Error storing recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update with actual results (when you see if the recommendation worked)
app.post('/api/ai/update-outcome', async (req, res) => {
  try {
    const { recommendationId, actualResults } = req.body;
    
    console.log(`📊 Updating outcome for ${recommendationId}:`, actualResults);
    
    await aiMemory.storeOutcome(recommendationId, actualResults);
    
    const insights = aiMemory.getInsights(actualResults.accountId);
    
    res.json({
      success: true,
      message: `Thank you! I've learned from this result.`,
      learningUpdate: {
        mySuccessRate: `${(insights.overallSuccessRate * 100).toFixed(1)}%`,
        totalRecommendations: insights.totalRecommendations,
        confidenceLevel: insights.successfulPatterns.length > 0 ? 'Growing' : 'Learning'
      },
      insights: insights
    });
    
  } catch (error) {
    console.error('Error updating outcome:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI insights for an account
app.get('/api/ai/insights/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const insights = aiMemory.getInsights(accountId);
    
    res.json({
      success: true,
      accountId: accountId,
      aiInsights: {
        myLearningProgress: {
          totalRecommendationsMade: insights.totalRecommendations,
          overallSuccessRate: `${(insights.overallSuccessRate * 100).toFixed(1)}%`,
          confidenceLevel: insights.overallSuccessRate > 0.7 ? 'High' : 
                          insights.overallSuccessRate > 0.4 ? 'Medium' : 'Learning'
        },
        whatIveLearnedWorks: insights.bestPractices,
        whatIveLearnedToAvoid: insights.thingsToAvoid,
        highConfidenceStrategies: insights.successfulPatterns.map(p => p.type),
        needMoreDataOn: insights.riskyPatterns.map(p => p.type)
      }
    });
    
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced analysis that includes AI learning
app.get('/api/chatgpt/smart-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🧠 Smart AI analysis requested: ${accountId}`);
    
    // Get regular analysis
    const regularAnalysis = await executeGAQLQuery(`
      SELECT 
        campaign.name,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros,
        metrics.ctr
      FROM campaign 
      WHERE segments.date DURING ${period}
      ORDER BY metrics.cost_micros DESC
    `, accountId);
    
    // Get AI insights
    const aiInsights = aiMemory.getInsights(accountId);
    
    // Combine data analysis with AI learning
    const smartRecommendations = [];
    
    if (regularAnalysis.success) {
      const campaigns = regularAnalysis.data;
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.cost_micros || 0), 0) / 1000000;
      const avgConversionRate = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0) / 
                               campaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0);
      
      // Use AI learning to make smarter recommendations
      if (aiInsights.overallSuccessRate > 0.6) {
        // High confidence recommendations
        smartRecommendations.push({
          type: 'high_confidence',
          recommendation: `Based on ${aiInsights.totalRecommendations} previous recommendations with ${(aiInsights.overallSuccessRate * 100).toFixed(1)}% success rate`,
          action: aiInsights.bestPractices.length > 0 ? 
            `Apply proven strategy: ${aiInsights.bestPractices[0]}` : 
            `Continue current approach - you're performing well`,
          confidence: '🟢 High',
          reasoning: 'My learning data shows this approach works for your account'
        });
      } else {
        // Learning mode recommendations
        smartRecommendations.push({
          type: 'learning_mode',
          recommendation: `I'm still learning what works best for your account (${aiInsights.totalRecommendations} recommendations so far)`,
          action: 'Let\'s test conservative optimizations and track results',
          confidence: '🟡 Learning',
          reasoning: 'Building knowledge about your account performance patterns'
        });
      }
      
      // Account-specific insights
      if (totalSpend > 5000 && avgConversionRate < 0.02) {
        smartRecommendations.push({
          type: 'spend_efficiency',
          recommendation: `High spend ($${totalSpend.toFixed(0)}) with low conversion rate (${(avgConversionRate * 100).toFixed(2)}%)`,
          action: 'Focus on conversion rate optimization before scaling',
          confidence: aiInsights.successfulPatterns.find(p => p.type === 'conversion_optimization') ? '🟢 Proven' : '🟡 Test',
          reasoning: aiInsights.bestPractices.includes('conversion_optimization') ? 
            'Previously successful strategy for your account' : 
            'Logical next step based on data'
        });
      }
    }
    
    res.json({
      success: true,
      accountId: accountId,
      smartAnalysis: {
        aiLearningStatus: {
          recommendationsMade: aiInsights.totalRecommendations,
          successRate: `${(aiInsights.overallSuccessRate * 100).toFixed(1)}%`,
          confidenceLevel: aiInsights.overallSuccessRate > 0.6 ? 'Experienced' : 'Learning'
        },
        dataAnalysis: regularAnalysis.success ? {
          totalCampaigns: regularAnalysis.data.length,
          totalSpend: `$${(regularAnalysis.data.reduce((sum, c) => sum + (c.metrics?.cost_micros || 0), 0) / 1000000).toFixed(2)}`,
          avgConversionRate: `${(avgConversionRate * 100).toFixed(2)}%`
        } : null,
        smartRecommendations: smartRecommendations,
        provenStrategies: aiInsights.bestPractices,
        avoidsBasedOnLearning: aiInsights.thingsToAvoid.map(f => f.action)
      }
    });
    
  } catch (error) {
    console.error('Error in smart analysis:', error);
    res.status(500).json({ error: error.message });
  }
});
// ==================== AI LEARNING MONITORING ====================

// Monitor AI learning progress
app.get('/api/ai/learning-dashboard', async (req, res) => {
  try {
    const allPatterns = Object.values(aiMemory.memory.patterns);
    const allRecommendations = aiMemory.memory.recommendations;
    const completedRecs = allRecommendations.filter(r => r.status === 'completed');
    const successfulRecs = allRecommendations.filter(r => r.outcome === true);
    
    // Calculate learning metrics
    const overallSuccessRate = completedRecs.length > 0 ? 
      (successfulRecs.length / completedRecs.length) : 0;
    
    // Learning velocity (how fast AI is learning)
    const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentRecs = allRecommendations.filter(r => 
      new Date(r.timestamp).getTime() > last30Days
    );
    
    // Confidence by recommendation type
    const confidenceByType = {};
    allPatterns.forEach(pattern => {
      if (!confidenceByType[pattern.type]) {
        confidenceByType[pattern.type] = {
          confidence: 0,
          attempts: 0,
          successes: 0
        };
      }
      confidenceByType[pattern.type].confidence = pattern.confidence;
      confidenceByType[pattern.type].attempts = pattern.successCount + pattern.failureCount;
      confidenceByType[pattern.type].successes = pattern.successCount;
    });
    
    res.json({
      success: true,
      learningDashboard: {
        overview: {
          totalRecommendations: allRecommendations.length,
          completedRecommendations: completedRecs.length,
          pendingRecommendations: allRecommendations.filter(r => r.status === 'pending').length,
          overallSuccessRate: `${(overallSuccessRate * 100).toFixed(1)}%`,
          learningVelocity: `${recentRecs.length} recommendations in last 30 days`,
          expertiseLevel: overallSuccessRate > 0.7 ? 'Expert' : 
                         overallSuccessRate > 0.4 ? 'Intermediate' : 'Learning'
        },
        learningPatterns: Object.keys(confidenceByType).map(type => ({
          recommendationType: type,
          confidence: `${(confidenceByType[type].confidence * 100).toFixed(1)}%`,
          totalAttempts: confidenceByType[type].attempts,
          successfulAttempts: confidenceByType[type].successes,
          successRate: confidenceByType[type].attempts > 0 ? 
            `${((confidenceByType[type].successes / confidenceByType[type].attempts) * 100).toFixed(1)}%` : '0%',
          status: confidenceByType[type].confidence > 0.7 ? '🟢 Mastered' :
                  confidenceByType[type].confidence > 0.4 ? '🟡 Learning' : '🔴 Needs Data'
        })),
        recentActivity: allRecommendations.slice(-10).reverse().map(r => ({
          id: r.id,
          date: r.timestamp.split('T')[0],
          time: r.timestamp.split('T')[1].split('.')[0],
          account: r.accountId,
          type: r.recommendation.type,
          action: r.recommendation.action,
          status: r.status,
          outcome: r.outcome === true ? '✅ Success' : 
                   r.outcome === false ? '❌ Failed' : '⏳ Pending',
          expectedImpact: r.recommendation.expectedImpact
        })),
        knowledgeGaps: Object.keys(confidenceByType)
          .filter(type => confidenceByType[type].confidence < 0.3)
          .map(type => ({
            area: type,
            issue: 'Needs more data to learn patterns',
            suggestion: 'Make more recommendations of this type and track results'
          })),
        bestLearnings: Object.keys(confidenceByType)
          .filter(type => confidenceByType[type].confidence > 0.7)
          .map(type => ({
            area: type,
            confidence: `${(confidenceByType[type].confidence * 100).toFixed(1)}%`,
            insight: `High success rate in ${type} recommendations`
          }))
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        learningVersion: '1.0',
        dataRetention: 'Persistent across server restarts'
      }
    });
    
  } catch (error) {
    console.error('Error in learning dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      fallback: 'Learning dashboard temporarily unavailable'
    });
  }
});

// Get learning insights for a specific account
app.get('/api/ai/account-learning/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const insights = aiMemory.getInsights(accountId);
    
    // Calculate account-specific learning metrics
    const accountRecs = aiMemory.memory.recommendations.filter(r => r.accountId === accountId);
    const completedAccountRecs = accountRecs.filter(r => r.status === 'completed');
    const successfulAccountRecs = accountRecs.filter(r => r.outcome === true);
    
    const accountSuccessRate = completedAccountRecs.length > 0 ? 
      (successfulAccountRecs.length / completedAccountRecs.length) : 0;
    
    res.json({
      success: true,
      accountId: accountId,
      accountLearning: {
        summary: {
          recommendationsMade: accountRecs.length,
          recommendationsCompleted: completedAccountRecs.length,
          successRate: `${(accountSuccessRate * 100).toFixed(1)}%`,
          myConfidenceLevel: accountSuccessRate > 0.7 ? 'High Confidence' :
                           accountSuccessRate > 0.4 ? 'Medium Confidence' : 'Still Learning',
          expertiseStatus: accountSuccessRate > 0.6 ? 'I know this account well' : 'Learning your account patterns'
        },
        whatIveLearnedWorks: insights.bestPractices.slice(0, 5),
        whatIveLearnedToAvoid: insights.thingsToAvoid.slice(0, 3),
        recommendationHistory: accountRecs.map(r => ({
          date: r.timestamp.split('T')[0],
          type: r.recommendation.type,
          action: r.recommendation.action.substring(0, 80) + (r.recommendation.action.length > 80 ? '...' : ''),
          expectedImpact: r.recommendation.expectedImpact,
          actualOutcome: r.outcome === true ? '✅ Worked' : 
                        r.outcome === false ? '❌ Failed' : '⏳ Waiting for results',
          lessonLearned: r.outcome === true ? 'Reinforced strategy' :
                        r.outcome === false ? 'Avoid similar approaches' : 'Monitoring results'
        })),
        nextRecommendationGuidance: {
          confidence: accountSuccessRate > 0.6 ? 'High - I have proven strategies for your account' :
                     accountSuccessRate > 0.3 ? 'Medium - Still learning your account patterns' :
                     'Low - Need more data to understand what works',
          approach: accountSuccessRate > 0.6 ? 'Will use proven strategies' :
                   'Will test conservative approaches and learn from results'
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting account learning insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// Learning analytics endpoint
app.get('/api/ai/learning-analytics', async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const cutoffDate = Date.now() - (parseInt(timeframe) * 24 * 60 * 60 * 1000);
    
    const recentRecs = aiMemory.memory.recommendations.filter(r => 
      new Date(r.timestamp).getTime() > cutoffDate
    );
    
    const recentOutcomes = aiMemory.memory.outcomes.filter(o => 
      new Date(o.timestamp).getTime() > cutoffDate
    );
    
    // Learning trends
    const learningTrends = {};
    recentOutcomes.forEach(outcome => {
      const date = outcome.timestamp.split('T')[0];
      if (!learningTrends[date]) {
        learningTrends[date] = { successes: 0, failures: 0 };
      }
      if (outcome.wasSuccessful) {
        learningTrends[date].successes++;
      } else {
        learningTrends[date].failures++;
      }
    });
    
    res.json({
      success: true,
      analytics: {
        timeframe: `Last ${timeframe} days`,
        activity: {
          recommendationsMade: recentRecs.length,
          outcomesRecorded: recentOutcomes.length,
          successfulPredictions: recentOutcomes.filter(o => o.wasSuccessful).length,
          accuracyTrend: recentOutcomes.length > 0 ? 
            `${((recentOutcomes.filter(o => o.wasSuccessful).length / recentOutcomes.length) * 100).toFixed(1)}%` : 'No data'
        },
        dailyLearningTrend: Object.keys(learningTrends).map(date => ({
          date: date,
          successes: learningTrends[date].successes,
          failures: learningTrends[date].failures,
          successRate: learningTrends[date].successes + learningTrends[date].failures > 0 ?
            `${((learningTrends[date].successes / (learningTrends[date].successes + learningTrends[date].failures)) * 100).toFixed(1)}%` : '0%'
        })).sort((a, b) => a.date.localeCompare(b.date)),
        improvementAreas: Object.values(aiMemory.memory.patterns)
          .filter(p => p.failureCount > p.successCount && p.failureCount > 1)
          .map(p => ({
            area: p.type,
            needsImprovement: `${p.failureCount} failures vs ${p.successCount} successes`,
            suggestion: 'Review approach and test different strategies'
          }))
      }
    });
    
  } catch (error) {
    console.error('Error in learning analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENHANCED ANALYSIS ENDPOINTS ====================

// IMPRESSION SHARE ANALYSIS
app.get('/api/intelligence/impression-share/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`📊 Impression share analysis: ${accountId}`);
    
    const impressionShareQuery = intelligenceEngine.buildQuery('impressionShareIntelligence', period);
    const result = await executeGAQLQuery(impressionShareQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const impressionShareAnalysis = GoogleAdsIntelligenceEngine.analyzeImpressionShare(result.data);
    
    res.json({
      success: true,
      accountId: accountId,
      period: period,
      impressionShareIntelligence: impressionShareAnalysis
    });

  } catch (error) {
    console.error('Error in impression share analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// PERFORMANCE MAX ANALYSIS
app.get('/api/intelligence/performance-max/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🚀 Performance Max analysis: ${accountId}`);
    
    const pMaxQuery = intelligenceEngine.buildQuery('performanceMaxIntelligence', period);
    const result = await executeGAQLQuery(pMaxQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const assetGroups = {};
    result.data.forEach(row => {
      const assetGroupName = row.asset_group?.name || 'Unknown';
      if (!assetGroups[assetGroupName]) {
        assetGroups[assetGroupName] = {
          impressions: 0, clicks: 0, conversions: 0, spend: 0,
          finalUrls: row.asset_group?.final_urls || []
        };
      }
      assetGroups[assetGroupName].impressions += row.metrics?.impressions || 0;
      assetGroups[assetGroupName].clicks += row.metrics?.clicks || 0;
      assetGroups[assetGroupName].conversions += row.metrics?.conversions || 0;
      assetGroups[assetGroupName].spend += (row.metrics?.cost_micros || 0) / 1000000;
    });

    const performanceMaxAnalysis = {
      totalAssetGroups: Object.keys(assetGroups).length,
      assetGroupPerformance: Object.keys(assetGroups).map(name => ({
        assetGroup: name,
        ...assetGroups[name],
        efficiency: assetGroups[name].spend > 0 ? 
          (assetGroups[name].conversions / assetGroups[name].spend).toFixed(2) : '0',
        conversionRate: assetGroups[name].clicks > 0 ? 
          `${((assetGroups[name].conversions / assetGroups[name].clicks) * 100).toFixed(2)}%` : '0%'
      })).sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency))
    };
    
    res.json({
      success: true,
      accountId: accountId,
      period: period,
      performanceMaxIntelligence: performanceMaxAnalysis
    });

  } catch (error) {
    console.error('Error in Performance Max analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// SHOPPING ANALYSIS
app.get('/api/intelligence/shopping-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🛒 Shopping analysis: ${accountId}`);
    
    const shoppingQuery = intelligenceEngine.buildQuery('shoppingIntelligence', period);
    const result = await executeGAQLQuery(shoppingQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const categories = {};
    const brands = {};
    const products = {};

    result.data.forEach(row => {
      const category = row.segments?.product_category_level1 || 'Unknown';
      const brand = row.segments?.product_brand || 'Unknown';
      const productId = row.segments?.product_item_id || 'Unknown';

      // Category analysis
      if (!categories[category]) {
        categories[category] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
      }
      categories[category].impressions += row.metrics?.impressions || 0;
      categories[category].clicks += row.metrics?.clicks || 0;
      categories[category].conversions += row.metrics?.conversions || 0;
      categories[category].spend += (row.metrics?.cost_micros || 0) / 1000000;
      categories[category].revenue += row.metrics?.conversions_value || 0;

      // Brand analysis
      if (!brands[brand]) {
        brands[brand] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
      }
      brands[brand].impressions += row.metrics?.impressions || 0;
      brands[brand].clicks += row.metrics?.clicks || 0;
      brands[brand].conversions += row.metrics?.conversions || 0;
      brands[brand].spend += (row.metrics?.cost_micros || 0) / 1000000;
      brands[brand].revenue += row.metrics?.conversions_value || 0;

      // Top products
      if (!products[productId]) {
        products[productId] = {
          title: row.segments?.product_title,
          price: row.segments?.product_price,
          impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0
        };
      }
      products[productId].impressions += row.metrics?.impressions || 0;
      products[productId].clicks += row.metrics?.clicks || 0;
      products[productId].conversions += row.metrics?.conversions || 0;
      products[productId].spend += (row.metrics?.cost_micros || 0) / 1000000;
      products[productId].revenue += row.metrics?.conversions_value || 0;
    });

    const shoppingAnalysis = {
      categoryPerformance: Object.keys(categories).map(cat => ({
        category: cat,
        ...categories[cat],
        roas: categories[cat].spend > 0 ? (categories[cat].revenue / categories[cat].spend).toFixed(2) : '0'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 10),
      
      brandPerformance: Object.keys(brands).map(brand => ({
        brand: brand,
        ...brands[brand],
        roas: brands[brand].spend > 0 ? (brands[brand].revenue / brands[brand].spend).toFixed(2) : '0'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 10),
      
      topProducts: Object.keys(products).map(productId => ({
        productId: productId,
        ...products[productId],
        roas: products[productId].spend > 0 ? (products[productId].revenue / products[productId].spend).toFixed(2) : '0'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 20)
    };
    
    res.json({
      success: true,
      accountId: accountId,
      period: period,
      shoppingIntelligence: shoppingAnalysis
    });

  } catch (error) {
    console.error('Error in shopping analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW CUSTOMER LIFETIME VALUE ANALYSIS
app.get('/api/intelligence/customer-ltv/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`💰 Customer LTV analysis: ${accountId}`);
    
    const ltvQuery = intelligenceEngine.buildQuery('customerLifetimeValueIntelligence', period);
    const result = await executeGAQLQuery(ltvQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const ltvAnalysis = GoogleAdsIntelligenceEngine.analyzeNewCustomerLTV(result.data);
    
    res.json({
      success: true,
      accountId: accountId,
      period: period,
      customerLTVIntelligence: ltvAnalysis
    });

  } catch (error) {
    console.error('Error in customer LTV analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Agency Google Ads API Server running on port ${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/test`);
  console.log(`📊 Ready to analyze multiple client accounts!`);
});
