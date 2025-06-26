// ==================== ALL IMPORTS AT THE TOP ====================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleAdsApi } from 'google-ads-api';
import SimpleAIMemory from './ai-memory.js';

// ==================== CONFIGURATION ====================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set up Google Ads client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Initialize AI Memory System
const aiMemory = new SimpleAIMemory();
console.log('🧠 AI Memory System initialized');

// ==================== ENHANCED GOOGLE ADS INTELLIGENCE ENGINE ====================

class GoogleAdsIntelligenceEngine {
  constructor() {
    this.dataLayers = {
      account: 'customer',
      campaign: 'campaign',
      adGroup: 'ad_group', 
      ads: 'ad_group_ad',
      keywords: 'keyword_view',
      searchTerms: 'search_term_view',
      performanceMax: 'asset_group',
      shopping: 'shopping_performance_view',
      video: 'video',
      audiences: 'audience_view',
      locations: 'geographic_view',
      conversions: 'conversion_action'
    };
  }

  buildQuery(analysisType, dateRange = 'LAST_30_DAYS', filters = {}) {
    const queries = {
      accountOverview: `
        SELECT 
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.manager
        FROM customer
      `,

      campaignIntelligence: `
        SELECT 
          customer.id,
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          segments.date,
          segments.day_of_week,
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
        ORDER BY metrics.cost_micros DESC
      `,

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
          metrics.search_rank_lost_impression_share
        FROM campaign
        WHERE segments.date DURING ${dateRange}
          AND metrics.impressions > 0
          AND campaign.advertising_channel_type = 'SEARCH'
        ORDER BY metrics.search_impression_share DESC
      `,

      shoppingIntelligence: `
        SELECT 
          campaign.name,
          ad_group.name,
          segments.product_item_id,
          segments.product_title,
          segments.product_brand,
          segments.product_category_level1,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM shopping_performance_view
        WHERE segments.date DURING ${dateRange}
          AND metrics.impressions > 0
        ORDER BY metrics.conversions_value DESC
      `,

      performanceMaxIntelligence: `
        SELECT 
          campaign.name,
          campaign.advertising_channel_type,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date DURING ${dateRange}
          AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
          AND metrics.impressions > 0
        ORDER BY metrics.conversions DESC
      `,

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

      searchTermsIntelligence: `
        SELECT 
          search_term_view.search_term,
          search_term_view.status,
          campaign.name,
          ad_group.name,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM search_term_view 
        WHERE segments.date DURING ${dateRange}
          AND metrics.impressions > 0
        ORDER BY metrics.conversions_value DESC
      `,

      keywordIntelligence: `
        SELECT 
          campaign.name,
          ad_group.name,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.status,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.search_impression_share
        FROM keyword_view 
        WHERE segments.date DURING ${dateRange}
          AND ad_group_criterion.status = 'ENABLED'
          AND metrics.impressions > 0
        ORDER BY metrics.cost_micros DESC
      `,

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
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM ad_group_ad 
        WHERE segments.date DURING ${dateRange}
          AND ad_group_ad.status = 'ENABLED'
          AND metrics.impressions > 0
        ORDER BY metrics.conversions DESC
      `
    };

    return queries[analysisType] || queries.campaignIntelligence;
  }

  static analyzeImpressionShare(campaignData) {
    const impressionShareMetrics = {
      search: { total: 0, budget_lost: 0, rank_lost: 0 },
      overall: { campaigns: 0, avg_share: 0 }
    };

    let totalCampaigns = 0;

    campaignData.forEach(row => {
      if (row.metrics?.search_impression_share) {
        impressionShareMetrics.search.total += row.metrics.search_impression_share;
        impressionShareMetrics.search.budget_lost += row.metrics?.search_budget_lost_impression_share || 0;
        impressionShareMetrics.search.rank_lost += row.metrics?.search_rank_lost_impression_share || 0;
        totalCampaigns++;
      }
    });

    return {
      searchImpressionShare: {
        avgShare: totalCampaigns > 0 ? `${((impressionShareMetrics.search.total / totalCampaigns) * 100).toFixed(1)}%` : '0%',
        budgetLoss: totalCampaigns > 0 ? `${((impressionShareMetrics.search.budget_lost / totalCampaigns) * 100).toFixed(1)}%` : '0%',
        rankLoss: totalCampaigns > 0 ? `${((impressionShareMetrics.search.rank_lost / totalCampaigns) * 100).toFixed(1)}%` : '0%'
      },
      recommendations: this.generateImpressionShareRecommendations(impressionShareMetrics, totalCampaigns)
    };
  }

  static generateImpressionShareRecommendations(metrics, campaignCount) {
    const recommendations = [];
    
    if (campaignCount === 0) return ['No impression share data available'];
    
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
      }
    };
  }
}

// Initialize the enhanced intelligence engine
const intelligenceEngine = new GoogleAdsIntelligenceEngine();
console.log('🧠 Enhanced Google Ads Intelligence Engine initialized');

// ==================== MIDDLEWARE SETUP ====================

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

async function executeGAQLQuery(query, customerId) {
  try {
    const cleanCustomerId = customerId.replace(/[-\s]/g, '');
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
    const result = await customer.query(query);
    
    return {
      success: true,
      data: result
    };
    
  } catch (error) {
    console.error(`Query failed for customer ${customerId}:`, error);
    return {
      success: false,
      error: error.message,
      details: error.failure?.errors || []
    };
  }
}

function getStatusText(status) {
  switch(status) {
    case 2: return 'ENABLED';
    case 3: return 'REMOVED'; 
    case 4: return 'PAUSED';
    default: return 'UNKNOWN';
  }
}

function validateDateRange(period) {
  const validRanges = [
    'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS',
    'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER',
    'THIS_YEAR', 'LAST_YEAR'
  ];
  
  return validRanges.includes(period) ? period : 'LAST_30_DAYS';
}

// ==================== BASIC ROUTES ====================

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
      'GET /api/chatgpt/quality-score/:id - Quality Score analysis'
    ]
  });
});

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

app.get('/api/chatgpt/accounts', async (req, res) => {
  try {
    console.log('ChatGPT requested account list - loading all MCC accounts');
    
    const knownAccounts = [
      '567-286-4299',
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
      '494-589-7843',
      '146-144-1066',
      '211-951-9725'
    ];
    
    const accountDetails = [];
    let successCount = 0;
    
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
        
        const errorMessage = accountError?.message || accountError?.toString() || 'Unknown error';
        
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
    
    accountDetails.sort((a, b) => {
      if (a.type === 'manager' && b.type !== 'manager') return -1;
      if (b.type === 'manager' && a.type !== 'manager') return 1;
      
      const spendA = parseFloat(a.monthlySpend.replace('$', ''));
      const spendB = parseFloat(b.monthlySpend.replace('$', ''));
      return spendB - spendA;
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
      message: `Loaded ${successCount}/${knownAccounts.length} accounts from your MCC`
    });
    
  } catch (error) {
    console.error('Error loading MCC accounts:', error);
    res.status(500).json({ 
      error: error.message,
      fallback: "Could not load MCC accounts"
    });
  }
});

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

app.get('/api/chatgpt/analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS', confidenceLevel = '90' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Smart analysis requested: ${accountId}, period: ${validPeriod}`);
    
    const analysisQuery = `
      SELECT 
        campaign.name,
        segments.date,
        segments.day_of_week,
        segments.device,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
        AND metrics.impressions > 0
      ORDER BY segments.date DESC
    `;
    
    const result = await executeGAQLQuery(analysisQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const dayPerformance = {};
    const devicePerformance = {};
    let totalSpend = 0;
    let totalConversions = 0;
    let totalClicks = 0;
    
    result.data.forEach(row => {
      const day = row.segments?.day_of_week || 'UNKNOWN';
      const device = row.segments?.device || 'UNKNOWN';
      const spend = (row.metrics?.cost_micros || 0) / 1000000;
      const conversions = row.metrics?.conversions || 0;
      const clicks = row.metrics?.clicks || 0;
      
      totalSpend += spend;
      totalConversions += conversions;
      totalClicks += clicks;
      
      if (!dayPerformance[day]) {
        dayPerformance[day] = { spend: 0, conversions: 0, clicks: 0, sessions: 0 };
      }
      dayPerformance[day].spend += spend;
      dayPerformance[day].conversions += conversions;
      dayPerformance[day].clicks += clicks;
      dayPerformance[day].sessions += 1;
      
      if (!devicePerformance[device]) {
        devicePerformance[device] = { spend: 0, conversions: 0, clicks: 0, sessions: 0 };
      }
      devicePerformance[device].spend += spend;
      devicePerformance[device].conversions += conversions;
      devicePerformance[device].clicks += clicks;
      devicePerformance[device].sessions += 1;
    });
    
    const insights = [];
    const accountAvgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
    
    if (totalSpend > 1000 && accountAvgConversionRate < 0.01) {
      insights.push({
        type: 'Conversion Rate Optimization',
        priority: 'High',
        description: `Conversion rate of ${(accountAvgConversionRate * 100).toFixed(2)}% is critically low for $${totalSpend.toFixed(0)} monthly spend.`,
        action: 'Audit landing pages, improve page speed, and test clearer CTAs'
      });
    }
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      analysis: {
        summary: {
          totalSpend: `$${totalSpend.toFixed(2)}`,
          totalConversions: totalConversions,
          overallConversionRate: `${(accountAvgConversionRate * 100).toFixed(2)}%`
        },
        dayOfWeekPerformance: dayPerformance,
        devicePerformance: devicePerformance,
        insights: insights,
        totalDataPoints: result.data.length
      }
    });
    
  } catch (error) {
    console.error('Error in analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chatgpt/keyword-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    const keywordQuery = `
      SELECT 
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        campaign.name,
        ad_group.name,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
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
      spend: (kw.metrics?.cost_micros || 0) / 1000000,
      conversions: kw.metrics?.conversions || 0,
      clicks: kw.metrics?.clicks || 0,
      conversionRate: (kw.metrics?.clicks || 0) > 0 ? (kw.metrics?.conversions || 0) / (kw.metrics?.clicks || 0) * 100 : 0
    }));
    
    const topPerformers = keywords
      .filter(kw => kw.conversionRate > 2 && kw.spend > 50)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 15);
    
    const underperformers = keywords
      .filter(kw => kw.conversionRate < 0.5 && kw.spend > 100)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 15);
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      keywordAnalysis: {
        totalKeywords: keywords.length,
        topPerformers: topPerformers,
        underperformers: underperformers
      }
    });
    
  } catch (error) {
    console.error('Error in keyword analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chatgpt/search-terms/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    const searchTermsQuery = `
      SELECT 
        search_term_view.search_term,
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
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
    
    result.data.forEach(term => {
      const searchTerm = term.search_term_view?.search_term?.toLowerCase() || '';
      const conversions = term.metrics?.conversions || 0;
      const clicks = term.metrics?.clicks || 0;
      const spend = (term.metrics?.cost_micros || 0) / 1000000;
      const conversionRate = clicks > 0 ? conversions / clicks * 100 : 0;
      
      if (conversionRate > 2 && clicks > 3 && spend > 10) {
        newKeywordOpportunities.push({
          searchTerm: searchTerm,
          triggeringKeyword: term.ad_group_criterion?.keyword?.text,
          conversions: conversions,
          spend: spend.toFixed(2),
          recommendation: 'Add as exact match keyword'
        });
      }
      
      if (spend > 20 && conversions === 0 && clicks > 3) {
        negativeKeywordRecommendations.push({
          searchTerm: searchTerm,
          wastedSpend: spend.toFixed(2),
          clicks: clicks,
          recommendation: 'Add as negative keyword'
        });
      }
    });
    
    const totalWastedSpend = negativeKeywordRecommendations.reduce((sum, item) => 
      sum + parseFloat(item.wastedSpend), 0);
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      searchTermAnalysis: {
        totalSearchTerms: result.data.length,
        newKeywordOpportunities: newKeywordOpportunities.slice(0, 20),
        negativeKeywordRecommendations: negativeKeywordRecommendations.slice(0, 20),
        potentialSavings: `$${totalWastedSpend.toFixed(2)}`
      }
    });
    
  } catch (error) {
    console.error('Error in search terms analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chatgpt/ad-copy-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    const adCopyQuery = `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.expanded_text_ad.headline_part1,
        ad_group_ad.ad.expanded_text_ad.headline_part2,
        ad_group_ad.ad.expanded_text_ad.description,
        ad_group_ad.status,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group_ad 
      WHERE segments.date DURING ${validPeriod}
        AND ad_group_ad.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.conversions DESC
      LIMIT 100
    `;
    
    const result = await executeGAQLQuery(adCopyQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const adAnalysis = result.data.map(ad => {
      const clicks = ad.metrics?.clicks || 0;
      const conversions = ad.metrics?.conversions || 0;
      const spend = (ad.metrics?.cost_micros || 0) / 1000000;
      const conversionRate = clicks > 0 ? (conversions / clicks * 100) : 0;
      
      const headlines = [
        ad.ad_group_ad?.ad?.expanded_text_ad?.headline_part1,
        ad.ad_group_ad?.ad?.expanded_text_ad?.headline_part2
      ].filter(h => h);
      
      const descriptions = [
        ad.ad_group_ad?.ad?.expanded_text_ad?.description
      ].filter(d => d);
      
      return {
        campaign: ad.campaign?.name,
        adGroup: ad.ad_group?.name,
        headlines: headlines,
        descriptions: descriptions,
        performance: {
          clicks: clicks,
          conversions: conversions,
          spend: spend.toFixed(2),
          conversionRate: conversionRate.toFixed(2)
        }
      };
    });
    
    const topPerformers = adAnalysis
      .filter(ad => ad.performance.conversions > 0)
      .sort((a, b) => parseFloat(b.performance.conversionRate) - parseFloat(a.performance.conversionRate))
      .slice(0, 10);
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      analysis: {
        totalAds: adAnalysis.length,
        topPerformers: topPerformers,
        copyRecommendations: [
          "Test emotional headlines on low-performing ads",
          "Add urgency elements to increase CTR",
          "Include specific benefits in descriptions"
        ]
      }
    });
    
  } catch (error) {
    console.error('Error in ad copy analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chatgpt/quality-score/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const qualityScoreQuery = `
      SELECT 
        campaign.name,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.quality_info.quality_score,
        metrics.clicks,
        metrics.cost_micros
      FROM keyword_view 
      WHERE segments.date DURING LAST_30_DAYS
        AND ad_group_criterion.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY ad_group_criterion.quality_info.quality_score ASC
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
        message: "No Quality Score data available",
        accountId: accountId
      });
    }
    
    const qualityScores = validKeywords.map(kw => kw.ad_group_criterion.quality_info.quality_score);
    const avgQualityScore = qualityScores.reduce((sum, qs) => sum + qs, 0) / qualityScores.length;
    
    const lowQualityKeywords = validKeywords
      .filter(kw => kw.ad_group_criterion.quality_info.quality_score <= 5)
      .map(kw => ({
        keyword: kw.ad_group_criterion?.keyword?.text,
        campaign: kw.campaign?.name,
        qualityScore: kw.ad_group_criterion.quality_info.quality_score,
        spend: ((kw.metrics?.cost_micros || 0) / 1000000).toFixed(2)
      }))
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))
      .slice(0, 20);
    
    res.json({
      success: true,
      accountId: accountId,
      qualityScoreAnalysis: {
        summary: {
          averageQualityScore: avgQualityScore.toFixed(1),
          totalKeywords: validKeywords.length,
          lowQualityCount: lowQualityKeywords.length
        },
        lowQualityKeywords: lowQualityKeywords,
        recommendations: [
          "Focus on keywords with QS ≤5 and high spend first",
          "Improve ad relevance by including target keywords in headlines",
          "Optimize landing pages for mobile experience and speed"
        ]
      }
    });
    
  } catch (error) {
    console.error('Error in Quality Score analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== AI LEARNING ROUTES ====================

app.post('/api/ai/store-recommendation', async (req, res) => {
  try {
    const { accountId, recommendation } = req.body;
    
    const recommendationId = await aiMemory.storeRecommendation(accountId, recommendation);
    
    res.json({
      success: true,
      recommendationId: recommendationId,
      message: 'Recommendation stored successfully'
    });
    
  } catch (error) {
    console.error('Error storing recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai/insights/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const insights = aiMemory.getInsights(accountId);
    
    res.json({
      success: true,
      accountId: accountId,
      aiInsights: insights
    });
    
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ENHANCED ANALYSIS ENDPOINTS ====================

app.get('/api/intelligence/impression-share/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
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

app.get('/api/intelligence/customer-ltv/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
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

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Agency Google Ads API Server running on port ${PORT}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/test`);
  console.log(`📊 Ready to analyze multiple client accounts!`);
});
