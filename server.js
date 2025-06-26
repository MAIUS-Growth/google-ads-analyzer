// ==================== ALL IMPORTS AT THE TOP ====================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleAdsApi } from 'google-ads-api';
import SimpleAIMemory from './ai-memory.js';
// 🎯 Import our clean, organized fields file
import { QUERY_TEMPLATES, FIELD_COMBINATIONS, buildCustomQuery } from './google-ads-fields.js';

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
    // Much cleaner! No massive field definitions
    this.supportedAnalysisTypes = Object.keys(QUERY_TEMPLATES);
    console.log(`🔧 Intelligence Engine supports: ${this.supportedAnalysisTypes.join(', ')}`);
  }

  // ✨ MUCH CLEANER QUERY BUILDING
  buildQuery(analysisType, dateRange = 'LAST_30_DAYS', filters = {}) {
    // Use our pre-built query templates
    if (QUERY_TEMPLATES[analysisType]) {
      return QUERY_TEMPLATES[analysisType](dateRange);
    }

    // Fallback to campaign intelligence for unknown types
    console.log(`⚠️ Unknown analysis type: ${analysisType}, using campaignIntelligence`);
    return QUERY_TEMPLATES.campaignIntelligence(dateRange);
  }

  // Analysis methods stay the same
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
    message: 'Agency Google Ads API Server is running! (Refactored with Fields File)',
    timestamp: new Date().toISOString(),
    availableQueries: Object.keys(QUERY_TEMPLATES),
    endpoints: [
      'GET /api/chatgpt/accounts - List all accounts',
      'GET /api/chatgpt/account/:id - Account overview',
      'GET /api/chatgpt/metrics - Flexible metrics',
      'GET /api/chatgpt/analysis/:id - Statistical analysis',
      'GET /api/chatgpt/keyword-analysis/:id - Keyword gap analysis',
      'GET /api/chatgpt/search-terms/:id - Search terms mining',
      'GET /api/chatgpt/ad-copy-analysis/:id - Ad copy performance',
      'GET /api/chatgpt/quality-score/:id - Quality Score analysis',
      'GET /api/intelligence/shopping-analysis/:id - Shopping campaign analysis',
      'GET /api/intelligence/performance-max/:id - Performance Max analysis',
      'GET /api/intelligence/impression-share/:id - Impression share analysis',
      'GET /api/intelligence/customer-ltv/:id - Customer lifetime value analysis',
      'GET /api/chatgpt/smart-analysis/:id - AI-powered smart analysis',
      'GET /api/ai/insights/:id - AI learning insights',
      'GET /api/ai/learning-dashboard - AI learning dashboard',
      'POST /api/ai/store-recommendation - Store AI recommendation',
      'POST /api/execute-query - Custom GAQL queries'
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
      '567-286-4299', '852-070-8211', '998-480-7723', '498-931-0941',
      '798-101-9658', '884-091-7486', '735-725-8958', '256-530-5911',
      '796-673-9288', '511-562-4109', '396-211-6392', '443-339-7750',
      '233-304-0768', '533-365-4586', '781-020-0542', '552-675-5067',
      '291-914-6712', '148-160-0039', '464-650-0984', '494-589-7843',
      '146-144-1066', '211-951-9725'
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
        
        // 🎯 Using our clean query template
        const customerQuery = QUERY_TEMPLATES.accountOverview();
        
        const customerInfo = await customer.query(customerQuery);
        
        if (customerInfo && customerInfo.length > 0) {
          const info = customerInfo[0].customer;
          
          // 🎯 Using field combinations for cleaner queries
          const campaignQuery = buildCustomQuery(
            FIELD_COMBINATIONS.basicCampaignMetrics,
            'campaign',
            ['segments.date DURING LAST_30_DAYS'],
            'metrics.cost_micros DESC'
          );
          
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
      message: `Loaded ${successCount}/${knownAccounts.length} accounts from your MCC (Refactored!)`
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
    
    // 🎯 Clean query using our template
    const campaignQuery = QUERY_TEMPLATES.campaignIntelligence(validPeriod);
    
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

// ✨ MUCH CLEANER ENDPOINT DEFINITIONS
app.get('/api/chatgpt/keyword-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Keyword analysis requested: ${accountId}, period: ${validPeriod}`);
    
    // 🎯 One line query building!
    const keywordQuery = QUERY_TEMPLATES.keywordIntelligence(validPeriod) + '\nLIMIT 300';
    
    const result = await executeGAQLQuery(keywordQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Processing logic stays the same
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

// Continue with all other endpoints using the same clean pattern...

app.get('/api/chatgpt/metrics', async (req, res) => {
  try {
    const { accountId = "494-589-7843", period = "LAST_30_DAYS" } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Metrics requested: ${accountId}, period: ${validPeriod}`);
    
    // 🎯 Clean query using template
    const metricsQuery = QUERY_TEMPLATES.campaignIntelligence(validPeriod);
    
    const result = await executeGAQLQuery(metricsQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const processedMetrics = result.data.map(row => ({
      campaign: row.campaign?.name,
      status: getStatusText(row.campaign?.status),
      clicks: row.metrics?.clicks || 0,
      impressions: row.metrics?.impressions || 0,
      spend: `${((row.metrics?.cost_micros || 0) / 1000000).toFixed(2)}`,
      conversions: row.metrics?.conversions || 0,
      ctr: `${((row.metrics?.ctr || 0) * 100).toFixed(2)}%`,
      cpc: `${((row.metrics?.average_cpc || 0) / 1000000).toFixed(2)}`,
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
    
    // 🎯 Clean query using template
    const analysisQuery = QUERY_TEMPLATES.deviceTimeIntelligence(validPeriod);
    
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
        description: `Conversion rate of ${(accountAvgConversionRate * 100).toFixed(2)}% is critically low for ${totalSpend.toFixed(0)} monthly spend.`,
        action: 'Audit landing pages, improve page speed, and test clearer CTAs'
      });
    }
    
    res.json({
      success: true,
      accountId: accountId,
      period: validPeriod,
      analysis: {
        summary: {
          totalSpend: `${totalSpend.toFixed(2)}`,
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

app.get('/api/chatgpt/search-terms/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    console.log(`Search terms analysis requested: ${accountId}, period: ${validPeriod}`);
    
    // 🎯 Clean query using template
    const searchTermsQuery = QUERY_TEMPLATES.searchTermsIntelligence(validPeriod) + '\nLIMIT 500';
    
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
        potentialSavings: `${totalWastedSpend.toFixed(2)}`
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
    
    console.log(`Ad copy analysis requested: ${accountId}, period: ${validPeriod}`);
    
    // 🎯 Clean query using template
    const adCopyQuery = QUERY_TEMPLATES.adIntelligence(validPeriod) + '\nLIMIT 100';
    
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
    
    // 🎯 Custom quality score query using field combinations
    const qualityScoreQuery = buildCustomQuery(
      [
        ...FIELD_COMBINATIONS.keywordPerformanceFields,
        'ad_group_criterion.quality_info.quality_score',
        'ad_group_criterion.quality_info.creative_quality_score',
        'ad_group_criterion.quality_info.post_click_quality_score'
      ],
      'keyword_view',
      [
        'segments.date DURING LAST_30_DAYS',
        'ad_group_criterion.status = "ENABLED"',
        'metrics.impressions > 0'
      ],
      'ad_group_criterion.quality_info.quality_score ASC, metrics.cost_micros DESC'
    ) + '\nLIMIT 100';
    
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

// ==================== ENHANCED ANALYSIS ENDPOINTS ====================

app.get('/api/intelligence/impression-share/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`📊 Impression share analysis: ${accountId}`);
    
    // 🎯 Clean query using template
    const impressionShareQuery = QUERY_TEMPLATES.impressionShareIntelligence(period);
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

app.get('/api/intelligence/shopping-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🛒 Shopping analysis: ${accountId}, period: ${period}`);
    
    // 🎯 Clean query using template
    const shoppingQuery = QUERY_TEMPLATES.shoppingIntelligence(period);
    const result = await executeGAQLQuery(shoppingQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        message: 'Shopping analysis failed - this could be due to no shopping campaigns or API access issues'
      });
    }

    if (result.data.length === 0) {
      return res.json({
        success: true,
        accountId: accountId,
        period: period,
        message: 'No shopping campaign data found for this account',
        shoppingIntelligence: {
          totalProducts: 0,
          categoryPerformance: [],
          brandPerformance: [],
          topProducts: [],
          recommendations: ['No shopping campaigns detected in this account']
        }
      });
    }

    // Analyze shopping data
    const categories = {};
    const brands = {};
    const products = {};

    result.data.forEach(row => {
      const category = row.segments?.product_category_level1 || 'Unknown';
      const brand = row.segments?.product_brand || 'Unknown';
      const productId = row.segments?.product_item_id || 'Unknown';
      const productTitle = row.segments?.product_title || 'Unknown Product';

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

      // Product analysis
      if (!products[productId]) {
        products[productId] = {
          title: productTitle,
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
      totalProducts: Object.keys(products).length,
      categoryPerformance: Object.keys(categories).map(cat => ({
        category: cat,
        ...categories[cat],
        roas: categories[cat].spend > 0 ? (categories[cat].revenue / categories[cat].spend).toFixed(2) : '0',
        conversionRate: categories[cat].clicks > 0 ? ((categories[cat].conversions / categories[cat].clicks) * 100).toFixed(2) + '%' : '0%'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 10),
      
      brandPerformance: Object.keys(brands).map(brand => ({
        brand: brand,
        ...brands[brand],
        roas: brands[brand].spend > 0 ? (brands[brand].revenue / brands[brand].spend).toFixed(2) : '0',
        conversionRate: brands[brand].clicks > 0 ? ((brands[brand].conversions / brands[brand].clicks) * 100).toFixed(2) + '%' : '0%'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 10),
      
      topProducts: Object.keys(products).map(productId => ({
        productId: productId,
        title: products[productId].title,
        impressions: products[productId].impressions,
        clicks: products[productId].clicks,
        conversions: products[productId].conversions,
        spend: products[productId].spend.toFixed(2),
        revenue: products[productId].revenue.toFixed(2),
        roas: products[productId].spend > 0 ? (products[productId].revenue / products[productId].spend).toFixed(2) : '0',
        conversionRate: products[productId].clicks > 0 ? ((products[productId].conversions / products[productId].clicks) * 100).toFixed(2) + '%' : '0%'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)).slice(0, 20),

      recommendations: [
        `Focus on top-performing categories with ROAS > 3.0`,
        `Expand successful product lines with high conversion rates`,
        `Review low-performing products with high spend but poor ROAS`
      ]
    };
    
    res.json({
      success: true,
      accountId: accountId,
      period: period,
      shoppingIntelligence: shoppingAnalysis
    });

  } catch (error) {
    console.error('Error in shopping analysis:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Shopping campaign analysis failed - this may indicate no shopping campaigns exist or API access issues'
    });
  }
});

app.get('/api/intelligence/performance-max/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🚀 Performance Max analysis: ${accountId}`);
    
    // 🎯 Clean query using template
    const pMaxQuery = QUERY_TEMPLATES.performanceMaxIntelligence(period);
    const result = await executeGAQLQuery(pMaxQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    if (result.data.length === 0) {
      return res.json({
        success: true,
        accountId: accountId,
        period: period,
        message: 'No Performance Max campaigns found',
        performanceMaxIntelligence: {
          totalCampaigns: 0,
          campaignPerformance: [],
          recommendations: ['No Performance Max campaigns detected in this account']
        }
      });
    }

    const campaigns = {};
    result.data.forEach(row => {
      const campaignName = row.campaign?.name || 'Unknown Campaign';
      if (!campaigns[campaignName]) {
        campaigns[campaignName] = {
          impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0
        };
      }
      campaigns[campaignName].impressions += row.metrics?.impressions || 0;
      campaigns[campaignName].clicks += row.metrics?.clicks || 0;
      campaigns[campaignName].conversions += row.metrics?.conversions || 0;
      campaigns[campaignName].spend += (row.metrics?.cost_micros || 0) / 1000000;
      campaigns[campaignName].revenue += row.metrics?.conversions_value || 0;
    });

    const performanceMaxAnalysis = {
      totalCampaigns: Object.keys(campaigns).length,
      campaignPerformance: Object.keys(campaigns).map(name => ({
        campaign: name,
        ...campaigns[name],
        roas: campaigns[name].spend > 0 ? 
          (campaigns[name].revenue / campaigns[name].spend).toFixed(2) : '0',
        conversionRate: campaigns[name].clicks > 0 ? 
          ((campaigns[name].conversions / campaigns[name].clicks) * 100).toFixed(2) + '%' : '0%',
        ctr: campaigns[name].impressions > 0 ?
          ((campaigns[name].clicks / campaigns[name].impressions) * 100).toFixed(2) + '%' : '0%'
      })).sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas)),
      recommendations: [
        'Monitor asset group performance and refresh creative assets regularly',
        'Ensure conversion tracking is properly set up for accurate ROAS measurement',
        'Consider expanding successful Performance Max campaigns with higher budgets'
      ]
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

app.get('/api/intelligence/customer-ltv/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`💰 Customer LTV analysis: ${accountId}`);
    
    // 🎯 Clean query using template
    const ltvQuery = QUERY_TEMPLATES.customerLifetimeValueIntelligence(period);
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

app.get('/api/chatgpt/smart-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    
    console.log(`🧠 Smart AI analysis requested: ${accountId}`);
    
    // Get regular analysis using clean template
    const regularAnalysis = await executeGAQLQuery(
      QUERY_TEMPLATES.campaignIntelligence(period), 
      accountId
    );
    
    // Get AI insights
    const aiInsights = aiMemory.getInsights(accountId);
    
    const smartRecommendations = [];
    
    if (regularAnalysis.success) {
      const campaigns = regularAnalysis.data;
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.metrics?.cost_micros || 0), 0) / 1000000;
      const avgConversionRate = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0) / 
                               campaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0);
      
      if (aiInsights.overallSuccessRate > 0.6) {
        smartRecommendations.push({
          type: 'high_confidence',
          recommendation: `Based on ${aiInsights.totalRecommendations} previous recommendations with ${(aiInsights.overallSuccessRate * 100).toFixed(1)}% success rate`,
          action: aiInsights.bestPractices.length > 0 ? 
            `Apply proven strategy: ${aiInsights.bestPractices[0]}` : 
            `Continue current approach - you're performing well`,
          confidence: '🟢 High'
        });
      } else {
        smartRecommendations.push({
          type: 'learning_mode',
          recommendation: `I'm still learning what works best for your account (${aiInsights.totalRecommendations} recommendations so far)`,
          action: 'Let\'s test conservative optimizations and track results',
          confidence: '🟡 Learning'
        });
      }
      
      if (totalSpend > 5000 && avgConversionRate < 0.02) {
        smartRecommendations.push({
          type: 'spend_efficiency',
          recommendation: `High spend (${totalSpend.toFixed(0)}) with low conversion rate (${(avgConversionRate * 100).toFixed(2)}%)`,
          action: 'Focus on conversion rate optimization before scaling',
          confidence: '🟡 Test'
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
        smartRecommendations: smartRecommendations
      }
    });
    
  } catch (error) {
    console.error('Error in smart analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai/learning-dashboard', async (req, res) => {
  try {
    const allRecommendations = aiMemory.memory.recommendations;
    const completedRecs = allRecommendations.filter(r => r.status === 'completed');
    const successfulRecs = allRecommendations.filter(r => r.outcome === true);
    
    const overallSuccessRate = completedRecs.length > 0 ? 
      (successfulRecs.length / completedRecs.length) : 0;
    
    res.json({
      success: true,
      learningDashboard: {
        overview: {
          totalRecommendations: allRecommendations.length,
          completedRecommendations: completedRecs.length,
          pendingRecommendations: allRecommendations.filter(r => r.status === 'pending').length,
          overallSuccessRate: `${(overallSuccessRate * 100).toFixed(1)}%`,
          expertiseLevel: overallSuccessRate > 0.7 ? 'Expert' : 
                         overallSuccessRate > 0.4 ? 'Intermediate' : 'Learning'
        },
        recentActivity: allRecommendations.slice(-10).reverse().map(r => ({
          id: r.id,
          date: r.timestamp.split('T')[0],
          account: r.accountId,
          type: r.recommendation.type,
          action: r.recommendation.action,
          status: r.status,
          outcome: r.outcome === true ? '✅ Success' : 
                   r.outcome === false ? '❌ Failed' : '⏳ Pending'
        }))
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

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Agency Google Ads API Server running on port ${PORT} (REFACTORED!)`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/test`);
  console.log(`📊 Available Queries: ${Object.keys(QUERY_TEMPLATES).join(', ')}`);
  console.log(`🎯 Ready to analyze multiple client accounts with clean, maintainable code!`);
});
