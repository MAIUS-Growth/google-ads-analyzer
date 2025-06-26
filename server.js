// Enhanced Google Ads API Server - Phase 1: n8n Integration Ready
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleAdsApi } from 'google-ads-api';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Set up Google Ads client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Enhanced CORS for n8n integration
app.use(cors({
  origin: [
    'https://chatgpt.com',
    'https://chat.openai.com', 
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.N8N_WEBHOOK_URL || 'http://localhost:5678' // n8n default
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
      data: result,
      timestamp: new Date().toISOString(),
      processingTime: Date.now()
    };
    
  } catch (error) {
    console.error(`Query failed for customer ${customerId}:`, error);
    return {
      success: false,
      error: error.message,
      details: error.failure?.errors || [],
      timestamp: new Date().toISOString()
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
  
  if (period === 'LAST_90_DAYS') return 'THIS_QUARTER';
  return validRanges.includes(period) ? period : 'LAST_30_DAYS';
}

// n8n Webhook Integration
async function triggerN8nWorkflow(workflowName, data) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.log('N8N_WEBHOOK_URL not configured, skipping workflow trigger');
    return null;
  }
  
  try {
    const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/webhook/${workflowName}`;
    const response = await axios.post(webhookUrl, {
      ...data,
      source: 'google-ads-api-server',
      timestamp: new Date().toISOString()
    }, {
      timeout: 30000
    });
    
    console.log(`n8n workflow '${workflowName}' triggered successfully`);
    return response.data;
  } catch (error) {
    console.error(`Failed to trigger n8n workflow '${workflowName}':`, error.message);
    return null;
  }
}

// ==================== DATA-ONLY ENDPOINTS ====================

// Pure data endpoint - no business logic
app.get('/api/data/comprehensive-analysis/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    const analysisQuery = `
      SELECT 
        campaign.name,
        campaign.status,
        segments.date,
        segments.day_of_week,
        segments.hour,
        segments.device,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.search_impression_share
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
        AND metrics.impressions > 0
      ORDER BY segments.date DESC, metrics.cost_micros DESC
    `;
    
    const result = await executeGAQLQuery(analysisQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Pure data response - let n8n do the analysis
    const responseData = {
      accountId,
      period: validPeriod,
      dataPoints: result.data.length,
      rawData: result.data,
      metadata: {
        queryTime: result.timestamp,
        totalCampaigns: [...new Set(result.data.map(r => r.campaign?.name))].length,
        dateRange: {
          start: result.data[result.data.length - 1]?.segments?.date,
          end: result.data[0]?.segments?.date
        }
      }
    };
    
    // Trigger n8n analysis workflow
    triggerN8nWorkflow('comprehensive-analysis', {
      accountId,
      period: validPeriod,
      dataPoints: result.data.length,
      analysisType: 'comprehensive'
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error in comprehensive analysis:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Pure performance metrics data
app.get('/api/data/performance-metrics/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    const metricsQuery = `
      SELECT 
        campaign.name,
        campaign.status,
        campaign.id,
        metrics.clicks,
        metrics.impressions, 
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc,
        metrics.search_impression_share
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
      ORDER BY metrics.cost_micros DESC
    `;
    
    const result = await executeGAQLQuery(metricsQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Calculate totals for n8n decision making
    const totals = result.data.reduce((acc, row) => ({
      clicks: acc.clicks + (row.metrics?.clicks || 0),
      impressions: acc.impressions + (row.metrics?.impressions || 0),
      cost: acc.cost + (row.metrics?.cost_micros || 0),
      conversions: acc.conversions + (row.metrics?.conversions || 0),
      conversionsValue: acc.conversionsValue + (row.metrics?.conversions_value || 0)
    }), { clicks: 0, impressions: 0, cost: 0, conversions: 0, conversionsValue: 0});
    
    const responseData = {
      accountId,
      period: validPeriod,
      campaigns: result.data,
      totals,
      metadata: {
        timestamp: result.timestamp,
        totalCampaigns: result.data.length,
        activeCampaigns: result.data.filter(c => c.campaign?.status === 2).length
      }
    };
    
    // Trigger n8n workflow for performance analysis
    triggerN8nWorkflow('performance-analysis', {
      accountId,
      period: validPeriod,
      totalSpend: totals.cost / 1000000,
      totalConversions: totals.conversions,
      analysisType: 'performance'
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Pure keyword data
app.get('/api/data/keyword-analysis/:accountId', async (req, res) => {
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
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.search_impression_share
      FROM keyword_view 
      WHERE segments.date DURING ${validPeriod}
        AND ad_group_criterion.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT 500
    `;
    
    const result = await executeGAQLQuery(keywordQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    const responseData = {
      accountId,
      period: validPeriod,
      keywords: result.data,
      metadata: {
        timestamp: result.timestamp,
        totalKeywords: result.data.length,
        uniqueCampaigns: [...new Set(result.data.map(k => k.campaign?.name))].length
      }
    };
    
    // Trigger n8n keyword analysis workflow
    triggerN8nWorkflow('keyword-analysis', {
      accountId,
      period: validPeriod,
      keywordCount: result.data.length,
      analysisType: 'keywords'
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error in keyword analysis:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Account health data for n8n decision making
app.get('/api/data/account-health/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period = 'LAST_30_DAYS' } = req.query;
    const validPeriod = validateDateRange(period);
    
    // Get comprehensive health data
    const healthQuery = `
      SELECT 
        campaign.name,
        campaign.status,
        segments.date,
        metrics.clicks,
        metrics.impressions,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign 
      WHERE segments.date DURING ${validPeriod}
      ORDER BY segments.date DESC
    `;
    
    const result = await executeGAQLQuery(healthQuery, accountId);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    // Calculate health indicators for n8n
    const dailyData = {};
    result.data.forEach(row => {
      const date = row.segments?.date;
      if (!dailyData[date]) {
        dailyData[date] = { 
          spend: 0, 
          conversions: 0, 
          clicks: 0, 
          impressions: 0 
        };
      }
      
      dailyData[date].spend += (row.metrics?.cost_micros || 0) / 1000000;
      dailyData[date].conversions += row.metrics?.conversions || 0;
      dailyData[date].clicks += row.metrics?.clicks || 0;
      dailyData[date].impressions += row.metrics?.impressions || 0;
    });
    
    const dates = Object.keys(dailyData).sort();
    const totalSpend = Object.values(dailyData).reduce((sum, day) => sum + day.spend, 0);
    const totalConversions = Object.values(dailyData).reduce((sum, day) => sum + day.conversions, 0);
    
    const responseData = {
      accountId,
      period: validPeriod,
      dailyPerformance: dailyData,
      healthIndicators: {
        totalSpend,
        totalConversions,
        dailySpendVariance: calculateVariance(Object.values(dailyData).map(d => d.spend)),
        conversionConsistency: calculateConsistency(Object.values(dailyData).map(d => d.conversions)),
        activeDays: dates.length,
        campaignCount: [...new Set(result.data.map(r => r.campaign?.name))].length
      },
      metadata: {
        timestamp: result.timestamp,
        dataPoints: result.data.length
      }
    };
    
    // Trigger n8n health assessment workflow
    triggerN8nWorkflow('account-health-assessment', {
      accountId,
      totalSpend,
      totalConversions,
      healthScore: calculateHealthScore(responseData.healthIndicators),
      analysisType: 'health'
    });
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error in account health analysis:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== N8N WEBHOOK ENDPOINTS ====================

// Webhook to receive instructions from n8n
app.post('/api/webhook/n8n-command', async (req, res) => {
  try {
    const { action, accountId, parameters } = req.body;
    
    console.log(`Received n8n command: ${action} for account ${accountId}`);
    
    let result;
    
    switch (action) {
      case 'deep-dive-analysis':
        result = await deepDiveAnalysis(accountId, parameters);
        break;
      case 'anomaly-detection':
        result = await anomalyDetection(accountId, parameters);
        break;
      case 'forecasting':
        result = await performanceForecasting(accountId, parameters);
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
    
    res.json({
      success: true,
      action,
      accountId,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing n8n command:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== UTILITY FUNCTIONS ====================

function calculateVariance(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateConsistency(values) {
  const nonZeroValues = values.filter(v => v > 0);
  if (nonZeroValues.length === 0) return 0;
  return nonZeroValues.length / values.length;
}

function calculateHealthScore(indicators) {
  let score = 50; // Base score
  
  // Increase score for consistent performance
  if (indicators.conversionConsistency > 0.7) score += 20;
  if (indicators.conversionConsistency > 0.5) score += 10;
  
  // Adjust for spend patterns
  if (indicators.dailySpendVariance < indicators.totalSpend * 0.3) score += 15;
  
  // Active campaign management
  if (indicators.activeDays > 20) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

async function deepDiveAnalysis(accountId, parameters) {
  // Placeholder for deep dive analysis
  return { message: 'Deep dive analysis completed', accountId, parameters };
}

async function anomalyDetection(accountId, parameters) {
  // Placeholder for anomaly detection
  return { message: 'Anomaly detection completed', accountId, parameters };
}

async function performanceForecasting(accountId, parameters) {
  // Placeholder for forecasting
  return { message: 'Performance forecasting completed', accountId, parameters };
}

// ==================== LEGACY ENDPOINTS (Maintained for compatibility) ====================

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Enhanced Google Ads API Server with n8n Integration',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    n8n_integration: process.env.N8N_WEBHOOK_URL ? 'enabled' : 'disabled',
    endpoints: {
      data_endpoints: [
        'GET /api/data/comprehensive-analysis/:id',
        'GET /api/data/performance-metrics/:id',
        'GET /api/data/keyword-analysis/:id',
        'GET /api/data/account-health/:id'
      ],
      webhook_endpoints: [
        'POST /api/webhook/n8n-command'
      ],
      legacy_endpoints: [
        'POST /api/execute-query'
      ]
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Google Ads API Server running on port ${PORT}`);
  console.log(`🔗 n8n Integration: ${process.env.N8N_WEBHOOK_URL ? 'Enabled' : 'Disabled'}`);
  console.log(`📊 Ready for hybrid architecture workflows`);
});

export default app;
