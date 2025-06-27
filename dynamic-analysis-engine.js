// dynamic-analysis-engine.js - CREATE THIS AS A NEW FILE
// This enables flexible date analysis and natural language queries

import { QUERY_TEMPLATES, FIELD_COMBINATIONS, buildCustomQuery } from './google-ads-fields.js';

class DynamicAnalysisEngine {
  constructor() {
    this.seasonalPatterns = {};
    this.campaignHistory = {};
  }

  // 🎯 FLEXIBLE DATE RANGE PARSER
  parseDateRequest(query) {
    const now = new Date();
    const patterns = {
      // Year-over-year comparisons
      yoyPattern: /(?:this|current)\s+(\w+)\s+vs\s+last\s+year/i,
      lastYearSame: /same\s+time\s+last\s+year|year\s+over\s+year|yoy/i,
      
      // Holiday/Seasonal comparisons
      holidayPattern: /(?:4th of july|july 4th|fourth of july|independence day)/i,
      christmasPattern: /(?:christmas|holiday season|black friday|cyber monday)/i,
      summerPattern: /summer\s+(?:vs\s+)?winter|seasonal/i,
      
      // Custom date ranges
      customRange: /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i,
      monthYear: /(\w+)\s+(\d{4})/i,
      
      // Relative periods
      lastMonths: /last\s+(\d+)\s+months/i,
      quarterPattern: /(?:q1|q2|q3|q4|quarter)\s+(\d{4})/i
    };

    const result = {
      primary: { start: null, end: null, label: '' },
      comparison: { start: null, end: null, label: '' },
      type: 'single'
    };

    // Year-over-year detection
    if (patterns.yoyPattern.test(query) || patterns.lastYearSame.test(query)) {
      result.type = 'comparison';
      
      // Current period (this year)
      const thisYear = now.getFullYear();
      const lastYear = thisYear - 1;
      
      if (patterns.holidayPattern.test(query)) {
        // 4th of July comparison
        result.primary = {
          start: `${thisYear}-06-15`,
          end: `${thisYear}-07-15`,
          label: `July 4th ${thisYear}`
        };
        result.comparison = {
          start: `${lastYear}-06-15`,
          end: `${lastYear}-07-15`,
          label: `July 4th ${lastYear}`
        };
      } else {
        // Generic year-over-year (same months)
        const currentMonth = now.getMonth() + 1;
        result.primary = {
          start: `${thisYear}-${currentMonth.toString().padStart(2, '0')}-01`,
          end: `${thisYear}-${currentMonth.toString().padStart(2, '0')}-${new Date(thisYear, currentMonth, 0).getDate()}`,
          label: `${this.getMonthName(currentMonth)} ${thisYear}`
        };
        result.comparison = {
          start: `${lastYear}-${currentMonth.toString().padStart(2, '0')}-01`,
          end: `${lastYear}-${currentMonth.toString().padStart(2, '0')}-${new Date(lastYear, currentMonth, 0).getDate()}`,
          label: `${this.getMonthName(currentMonth)} ${lastYear}`
        };
      }
    }
    
    // Custom date range
    else if (patterns.customRange.test(query)) {
      const match = query.match(patterns.customRange);
      result.primary = {
        start: match[1],
        end: match[2],
        label: `${match[1]} to ${match[2]}`
      };
    }
    
    // Month/Year specific
    else if (patterns.monthYear.test(query)) {
      const match = query.match(patterns.monthYear);
      const month = this.parseMonth(match[1]);
      const year = parseInt(match[2]);
      
      result.primary = {
        start: `${year}-${month.toString().padStart(2, '0')}-01`,
        end: `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`,
        label: `${match[1]} ${year}`
      };
    }
    
    // Default to last 30 days
    else {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result.primary = {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        label: 'Last 30 Days'
      };
    }

    return result;
  }

  // 🎯 CAMPAIGN PATTERN MATCHER
  findCampaignPatterns(query, campaigns) {
    const patterns = {
      holiday: /(?:4th of july|july 4th|independence|patriotic|summer sale|holiday)/i,
      seasonal: /(?:summer|winter|spring|fall|autumn|seasonal)/i,
      promotional: /(?:sale|discount|promo|deal|offer|special)/i,
      brand: /(?:brand|branding|awareness)/i,
      conversion: /(?:conversion|purchase|buy|shop)/i
    };

    const matches = [];
    
    // Find campaigns matching the query intent
    campaigns.forEach(campaign => {
      const name = campaign.campaign?.name?.toLowerCase() || '';
      
      Object.entries(patterns).forEach(([type, pattern]) => {
        if (pattern.test(query) && pattern.test(name)) {
          matches.push({
            campaign: campaign,
            matchType: type,
            relevanceScore: this.calculateRelevance(query, name)
          });
        }
      });
    });

    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // 🎯 SEASONAL INTELLIGENCE
  detectSeasonalPatterns(campaignData, dateRanges) {
    const patterns = {
      seasonal: {},
      trends: {},
      recommendations: []
    };

    // Group data by month/season
    const monthlyData = {};
    
    campaignData.forEach(data => {
      const month = new Date(data.segments?.date || data.date || Date.now()).getMonth();
      const season = this.getSeason(month);
      
      if (!monthlyData[season]) {
        monthlyData[season] = { spend: 0, conversions: 0, revenue: 0, campaigns: 0 };
      }
      
      monthlyData[season].spend += (data.metrics?.cost_micros || 0) / 1000000;
      monthlyData[season].conversions += data.metrics?.conversions || 0;
      monthlyData[season].revenue += data.metrics?.conversions_value || 0;
      monthlyData[season].campaigns++;
    });

    // Calculate seasonal performance
    Object.entries(monthlyData).forEach(([season, data]) => {
      patterns.seasonal[season] = {
        totalSpend: data.spend.toFixed(2),
        totalConversions: data.conversions,
        roas: data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : '0',
        avgCampaigns: Math.round(data.campaigns / 3) // assuming 3 months per season
      };
    });

    return patterns;
  }

  // 🎯 COMPARATIVE ANALYSIS
  comparePerformance(period1Data, period2Data, period1Label, period2Label) {
    const comparison = {
      period1: this.calculatePeriodMetrics(period1Data, period1Label),
      period2: this.calculatePeriodMetrics(period2Data, period2Label),
      changes: {},
      insights: []
    };

    // Calculate percentage changes
    const metrics = ['spend', 'conversions', 'clicks', 'revenue'];
    metrics.forEach(metric => {
      const val1 = parseFloat(comparison.period1[metric]) || 0;
      const val2 = parseFloat(comparison.period2[metric]) || 0;
      
      if (val2 > 0) {
        const change = ((val1 - val2) / val2) * 100;
        comparison.changes[metric] = {
          absolute: val1 - val2,
          percentage: change.toFixed(1) + '%',
          direction: change > 0 ? 'increase' : 'decrease',
          magnitude: Math.abs(change) > 20 ? 'significant' : 'modest'
        };
      }
    });

    // Generate insights
    if (comparison.changes.conversions?.direction === 'increase') {
      comparison.insights.push({
        type: 'positive',
        message: `Conversions improved by ${comparison.changes.conversions.percentage} compared to ${period2Label}`
      });
    }

    if (parseFloat(comparison.period1.roas) > parseFloat(comparison.period2.roas)) {
      const roasImprovement = (parseFloat(comparison.period1.roas) - parseFloat(comparison.period2.roas)).toFixed(2);
      comparison.insights.push({
        type: 'positive',
        message: `ROAS improved by ${roasImprovement} (${comparison.period1.roas} vs ${comparison.period2.roas})`
      });
    }

    return comparison;
  }

  // Helper methods
  calculatePeriodMetrics(data, label) {
    const totals = data.reduce((acc, item) => {
      acc.spend += (item.metrics?.cost_micros || 0) / 1000000;
      acc.conversions += item.metrics?.conversions || 0;
      acc.clicks += item.metrics?.clicks || 0;
      acc.revenue += item.metrics?.conversions_value || 0;
      acc.impressions += item.metrics?.impressions || 0;
      return acc;
    }, { spend: 0, conversions: 0, clicks: 0, revenue: 0, impressions: 0 });

    return {
      label: label,
      campaigns: data.length,
      spend: totals.spend.toFixed(2),
      conversions: totals.conversions,
      clicks: totals.clicks,
      revenue: totals.revenue.toFixed(2),
      impressions: totals.impressions,
      roas: totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : '0',
      conversionRate: totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) + '%' : '0%',
      ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%'
    };
  }

  calculateRelevance(query, campaignName) {
    const queryWords = query.toLowerCase().split(/\s+/);
    const nameWords = campaignName.toLowerCase().split(/\s+/);
    
    let matches = 0;
    queryWords.forEach(word => {
      if (nameWords.some(nameWord => nameWord.includes(word) || word.includes(nameWord))) {
        matches++;
      }
    });
    
    return (matches / queryWords.length) * 100;
  }

  parseMonth(monthStr) {
    const months = {
      january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
      april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
      august: 8, aug: 8, september: 9, sep: 9, october: 10, oct: 10,
      november: 11, nov: 11, december: 12, dec: 12
    };
    return months[monthStr.toLowerCase()] || 1;
  }

  getMonthName(monthNum) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || 'Unknown';
  }

  getSeason(month) {
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  // 🎯 BUILD DYNAMIC GAQL QUERY
  buildDynamicQuery(analysisType, dateRange, campaignFilter = null) {
    let baseQuery = QUERY_TEMPLATES[analysisType] || QUERY_TEMPLATES.campaignIntelligence();
    
    // Replace the date condition
    if (dateRange.start && dateRange.end) {
      const dateCondition = `segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
      baseQuery = baseQuery.replace(/segments\.date DURING \w+/, dateCondition);
    }
    
    // Add campaign filtering if specified
    if (campaignFilter) {
      const campaignCondition = `AND campaign.name CONTAINS_IGNORE_CASE '${campaignFilter}'`;
      baseQuery = baseQuery.replace('ORDER BY', campaignCondition + '\n    ORDER BY');
    }
    
    return baseQuery;
  }
}

export default DynamicAnalysisEngine;
