// Advanced Analytics & Funnel Aggregator for Chutney Tubes Demand Test
const storeConfig = require("../config/store.js").storeConfig;

function normalizeString(str) {
  return (str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function calculateDashboardMetrics(events = [], signups = [], requests = [], options = {}) {
  const {
    startDate,
    endDate,
    campaign,
    includeInternal = false,
  } = options;

  // 1. Filter events by internal flag, date range, and campaign
  const filteredEvents = events.filter((ev) => {
    // Exclude internal visits unless toggled on
    if (!includeInternal && ev.isInternal) return false;

    // Date range filter
    if (startDate && new Date(ev.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(ev.timestamp) > new Date(endDate)) return false;

    // Campaign filter (utm_campaign or utm_source)
    if (campaign && campaign !== "all") {
      const c = (ev.utm && (ev.utm.utm_campaign || ev.utm.utm_source)) || "direct";
      if (normalizeString(c) !== normalizeString(campaign)) return false;
    }

    return true;
  });

  // Track unique visitors per stage
  const allVisitors = new Set();
  const addedToCartVisitors = new Set();
  const checkoutStartedVisitors = new Set();
  const detailsSubmittedVisitors = new Set();
  const payClickedVisitors = new Set();

  // Price variant buckets
  const variantData = {
    a: { visitors: new Set(), added: new Set(), checkout: new Set(), pay: new Set(), totalRevenue: 0, orderCount: 0 },
    b: { visitors: new Set(), added: new Set(), checkout: new Set(), pay: new Set(), totalRevenue: 0, orderCount: 0 },
    c: { visitors: new Set(), added: new Set(), checkout: new Set(), pay: new Set(), totalRevenue: 0, orderCount: 0 },
  };

  // Campaigns / Sources
  const campaignData = {};

  // Flavour counts
  const flavourDemand = {};
  const flavourViews = {};
  const flavourCartAdds = {};
  storeConfig.flavours.forEach((f) => {
    flavourDemand[f.id] = 0;
    flavourViews[f.id] = 0;
    flavourCartAdds[f.id] = 0;
  });

  // Pack Mix
  const packMix = { single: 0, combo: 0, pick3: 0 };

  // Postal Zones
  const zoneCounts = {};
  Object.keys(storeConfig.postalZones).forEach((k) => {
    zoneCounts[storeConfig.postalZones[k]] = 0;
  });

  // How people feel about chutney in a tube: split by Pay-pressers vs Everyone
  const tubeFeelings = {
    everyone: { "Love it, easier than a jar": 0, "Fine with it": 0, "Not sure yet": 0, "I'd rather have a jar or sachet": 0 },
    payPressers: { "Love it, easier than a jar": 0, "Fine with it": 0, "Not sure yet": 0, "I'd rather have a jar or sachet": 0 },
  };

  // Usage frequency answers
  const frequencyCounts = { Daily: 0, "A few times a week": 0, Weekly: 0, Rarely: 0 };

  // "What almost stopped you" answers
  const stoppedAnswers = [];

  // Pay-clicked visitors set for feeling split
  const payVisitorIds = new Set();

  // Scan events
  for (const ev of filteredEvents) {
    const vId = ev.visitorId || "anon";
    const v = (ev.variant || "a").toLowerCase();
    const camp = (ev.utm && (ev.utm.utm_campaign || ev.utm.utm_source)) || ev.source || "direct";
    const p = ev.payload || ev.metadata || {};

    allVisitors.add(vId);

    if (variantData[v]) {
      variantData[v].visitors.add(vId);
    }

    if (!campaignData[camp]) {
      campaignData[camp] = { visitors: new Set(), added: new Set(), checkout: new Set(), pay: new Set(), revenue: 0 };
    }
    campaignData[camp].visitors.add(vId);

    // Event specific handling
    if (ev.event === "product_viewed" || ev.event === "flavour_selected") {
      const fid = p.flavour;
      if (fid && flavourViews[fid] !== undefined) flavourViews[fid]++;
    } else if (ev.event === "add_to_cart") {
      addedToCartVisitors.add(vId);
      if (variantData[v]) variantData[v].added.add(vId);
      campaignData[camp].added.add(vId);

      const kind = p.kind || p.pack;
      if (kind && packMix[kind] !== undefined) packMix[kind]++;

      const flvs = p.flavours || (p.flavour ? [p.flavour] : []);
      flvs.forEach((fid) => {
        if (flavourCartAdds[fid] !== undefined) flavourCartAdds[fid]++;
      });
    } else if (ev.event === "checkout_started") {
      checkoutStartedVisitors.add(vId);
      if (variantData[v]) variantData[v].checkout.add(vId);
      campaignData[camp].checkout.add(vId);
    } else if (ev.event === "details_submitted") {
      detailsSubmittedVisitors.add(vId);
      const zone = p.zone;
      if (zone && zoneCounts[zone] !== undefined) {
        zoneCounts[zone]++;
      }
    } else if (ev.event === "pay_clicked") {
      payClickedVisitors.add(vId);
      payVisitorIds.add(vId);

      if (variantData[v]) {
        variantData[v].pay.add(vId);
        const tot = Number(p.total || p.totalAmount || 0);
        variantData[v].totalRevenue += tot;
        variantData[v].orderCount++;
      }
      campaignData[camp].pay.add(vId);
      campaignData[camp].revenue += Number(p.total || p.totalAmount || 0);

      // Tally tubes in orders where Pay was pressed
      const items = p.items || (p.flavour ? [{ quantity: p.qty || 1, flavours: [p.flavour] }] : []);
      items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const flvs = item.flavours || [];
        flvs.forEach((fid) => {
          if (flavourDemand[fid] !== undefined) flavourDemand[fid] += qty;
        });
      });
    } else if (ev.event === "survey_submitted") {
      const feeling = p.tubeFeeling;
      if (feeling && tubeFeelings.everyone[feeling] !== undefined) {
        tubeFeelings.everyone[feeling]++;
        if (payVisitorIds.has(vId)) {
          tubeFeelings.payPressers[feeling]++;
        }
      }

      const freq = p.frequency;
      if (freq && frequencyCounts[freq] !== undefined) {
        frequencyCounts[freq]++;
      }

      const feedback = p.stoppedText || p.feedback;
      if (feedback) {
        stoppedAnswers.push({
          visitorId: vId,
          text: feedback,
          feedback: feedback,
          frequency: freq,
          timestamp: ev.timestamp,
          variant: v,
          paid: payVisitorIds.has(vId),
        });
      }
    }
  }

  // Calculate Funnel (4 Core Stages: Visitors -> Add to Cart -> Checkout -> Pay Clicked)
  const totalV = Math.max(allVisitors.size, 1);
  const cartV = addedToCartVisitors.size;
  const checkoutV = checkoutStartedVisitors.size;
  const payV = payClickedVisitors.size;

  const funnel = [
    { step: "Visitors", count: allVisitors.size, dropoffPct: 0, pctOfTotal: 100 },
    {
      step: "Add to Cart",
      count: cartV,
      dropoffPct: Math.round(((totalV - cartV) / totalV) * 100),
      pctOfTotal: Math.round((cartV / totalV) * 100),
    },
    {
      step: "Checkout Started",
      count: checkoutV,
      dropoffPct: cartV > 0 ? Math.round(((cartV - checkoutV) / cartV) * 100) : 0,
      pctOfTotal: Math.round((checkoutV / totalV) * 100),
    },
    {
      step: "Pay Clicked",
      count: payV,
      dropoffPct: checkoutV > 0 ? Math.round(((checkoutV - payV) / checkoutV) * 100) : 0,
      pctOfTotal: Math.round((payV / totalV) * 100),
    },
  ];

  // Price Variant table
  let bestRate = -1;
  let bestVariant = "";
  const variantTable = ["a", "b", "c"].map((key) => {
    const vd = variantData[key];
    const vis = vd.visitors.size;
    const pays = vd.pay.size;
    const rate = vis > 0 ? (pays / vis) * 100 : 0;
    const aov = vd.orderCount > 0 ? Math.round(vd.totalRevenue / vd.orderCount) : 0;

    if (rate > bestRate && pays > 0) {
      bestRate = rate;
      bestVariant = key;
    }

    return {
      variant: key.toUpperCase(),
      priceInfo: `Single ₹${storeConfig.pricing.variants[key].single} / 3-Pack ₹${storeConfig.pricing.variants[key].pick3}`,
      visitors: vis,
      added: vd.added.size,
      checkout: vd.checkout.size,
      pay: pays,
      payRate: rate.toFixed(1) + "%",
      aov: `₹${aov}`,
      rawRate: rate,
    };
  });

  // Campaign table
  const campaignTable = Object.keys(campaignData).map((camp) => {
    const cd = campaignData[camp];
    const vis = cd.visitors.size;
    const pays = cd.pay.size;
    const rate = vis > 0 ? ((pays / vis) * 100).toFixed(1) + "%" : "0.0%";
    const aov = pays > 0 ? Math.round(cd.revenue / pays) : 0;
    return {
      campaign: camp,
      visitors: vis,
      added: cd.added.size,
      checkout: cd.checkout.size,
      pay: pays,
      payRate: rate,
      aov: `₹${aov}`,
    };
  });

  // Flavour Demand Table sorted by tubes ordered
  const sortedFlavours = storeConfig.flavours
    .map((f) => ({
      id: f.id,
      name: f.name,
      local: f.local,
      orderedTubes: flavourDemand[f.id] || 0,
      cartAdds: flavourCartAdds[f.id] || 0,
      views: flavourViews[f.id] || 0,
    }))
    .sort((a, b) => b.orderedTubes - a.orderedTubes || b.cartAdds - a.cartAdds);

  // Requested Chutneys Ranking (normalized case & spacing)
  const reqCounts = {};
  requests.forEach((r) => {
    const norm = normalizeString(r.name);
    if (!norm) return;
    if (!reqCounts[norm]) {
      reqCounts[norm] = { name: r.name, count: 0, region: r.region };
    }
    reqCounts[norm].count++;
  });
  const rankedRequests = Object.values(reqCounts).sort((a, b) => b.count - a.count);

  return {
    kpis: {
      visitors: allVisitors.size,
      addedToCartPct: totalV > 0 ? ((cartV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      startedCheckoutPct: totalV > 0 ? ((checkoutV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      pressedPayPct: totalV > 0 ? ((payV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      launchSignups: signups.length,
    },
    funnel,
    variantTable,
    bestVariant: bestVariant.toUpperCase(),
    campaignTable,
    tubeFeelings,
    sortedFlavours,
    packMix,
    zoneCounts,
    frequencyCounts,
    stoppedAnswers: stoppedAnswers.reverse(),
    rankedRequests,
    signupsList: signups.slice().reverse(),
    totalEventsCount: filteredEvents.length,
  };
}

function calculateMetrics(events = [], signups = [], requests = [], options = {}) {
  let actualSignups = signups;
  let actualRequests = requests;
  let actualOptions = options;
  if (!Array.isArray(signups) && typeof signups === "object") {
    actualOptions = signups;
    actualSignups = [];
    actualRequests = [];
  }
  const result = calculateDashboardMetrics(events, actualSignups, actualRequests, actualOptions);

  result.overview = {
    totalVisitors: result.kpis.visitors,
    totalAddToCart: result.funnel[1] ? result.funnel[1].count : 0,
    totalCheckout: result.funnel[2] ? result.funnel[2].count : 0,
    totalPayClicked: result.funnel[3] ? result.funnel[3].count : 0,
  };
  result.variantsSummary = result.variantTable.map((v) => ({
    variant: v.variant,
    visitors: v.visitors,
    addedToCart: v.added,
    checkout: v.checkout,
    payClicks: v.pay,
    conversionRate: v.payRate,
    aov: v.aov,
  }));
  result.surveyResponses = result.stoppedAnswers.map((s) => ({
    feedback: s.feedback || s.text,
    frequency: s.frequency,
    visitorId: s.visitorId,
  }));
  return result;
}

module.exports = {
  calculateDashboardMetrics,
  calculateMetrics,
  normalizeString,
};
