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

  // 1. Filter events
  const filteredEvents = events.filter((ev) => {
    if (!includeInternal && ev.isInternal) return false;
    if (startDate && new Date(ev.timestamp) < new Date(startDate)) return false;
    if (endDate && new Date(ev.timestamp) > new Date(endDate)) return false;
    if (campaign && campaign !== "all") {
      const c = (ev.utm && (ev.utm.utm_campaign || ev.utm.utm_source)) || "direct";
      if (normalizeString(c) !== normalizeString(campaign)) return false;
    }
    return true;
  });

  const allVisitors = new Set();
  const addedToCartVisitors = new Set();
  const checkoutStartedVisitors = new Set();
  const detailsSubmittedVisitors = new Set();
  const payClickedVisitors = new Set();

  const campaignData = {};
  const variantData = {
    A: { visitors: new Set(), payClicks: 0 },
    B: { visitors: new Set(), payClicks: 0 },
    C: { visitors: new Set(), payClicks: 0 },
  };

  // Per-tube tracking: cart adds and pay clicks
  const tubeStats = {};
  storeConfig.flavours.forEach((f) => {
    tubeStats[f.id] = {
      id: f.id,
      name: f.name,
      local: f.local,
      hindi: f.hindi,
      cartAdds: 0,
      payClicks: 0,
      views: 0,
    };
  });

  // Coming soon notify clicks
  const notifyClicks = {
    "teekhi-lehsuni": 0,
    "momo-chutney": 0,
    "sweet-mango": 0,
  };

  // Pack preference counts
  const packMix = {
    "chaat-pair": 0,
    "desi-chinese-pair": 0,
    "mayo-trio": 0,
    "sampler-8": 0,
    single: 0,
    combo: 0,
    pick3: 0,
  };

  // Survey answers
  const tubeFeelings = {
    everyone: { "Love it, easier than a jar": 0, "Fine with it": 0, "Not sure yet": 0, "I'd rather have a jar or sachet": 0 },
    payPressers: { "Love it, easier than a jar": 0, "Fine with it": 0, "Not sure yet": 0, "I'd rather have a jar or sachet": 0 },
  };

  const nextTubeWanted = {
    "Lehsuni": 0,
    "Momo chutney": 0,
    "Sweet mango": 0,
    "Peri-peri mayo": 0,
    "Kasundi": 0,
    "Something else": 0,
  };

  const frequencyCounts = { Daily: 0, "A few times a week": 0, Weekly: 0, Rarely: 0 };
  const stoppedAnswers = [];
  const payVisitorIds = new Set();
  let totalRevenue = 0;
  let orderCount = 0;

  for (const ev of filteredEvents) {
    const vId = ev.visitorId || "anon";
    const camp = (ev.utm && (ev.utm.utm_campaign || ev.utm.utm_source)) || ev.source || "direct";
    const p = ev.payload || ev.metadata || {};

    allVisitors.add(vId);

    if (ev.variant && variantData[ev.variant]) {
      variantData[ev.variant].visitors.add(vId);
    }

    if (!campaignData[camp]) {
      campaignData[camp] = { visitors: new Set(), added: new Set(), checkout: new Set(), pay: new Set(), revenue: 0 };
    }
    campaignData[camp].visitors.add(vId);

    if (ev.event === "product_viewed" || ev.event === "flavour_selected") {
      const fid = p.flavour || p.id;
      if (fid && tubeStats[fid]) {
        tubeStats[fid].views++;
      }
    } else if (ev.event === "notify_click") {
      const pid = p.product_id || p.id;
      if (pid) {
        notifyClicks[pid] = (notifyClicks[pid] || 0) + 1;
      }
    } else if (ev.event === "add_to_cart") {
      addedToCartVisitors.add(vId);
      campaignData[camp].added.add(vId);

      const kind = p.kind || p.pack;
      if (kind) {
        packMix[kind] = (packMix[kind] || 0) + 1;
      }

      const flvs = p.flavours || (p.flavour ? [p.flavour] : []);
      flvs.forEach((fid) => {
        if (!tubeStats[fid]) {
          tubeStats[fid] = { id: fid, name: fid, local: "", hindi: "", cartAdds: 0, payClicks: 0, views: 0 };
        }
        tubeStats[fid].cartAdds += Number(p.qty || p.quantity || 1);
      });
    } else if (ev.event === "checkout_started") {
      checkoutStartedVisitors.add(vId);
      campaignData[camp].checkout.add(vId);
    } else if (ev.event === "details_submitted") {
      detailsSubmittedVisitors.add(vId);
    } else if (ev.event === "pay_clicked") {
      payClickedVisitors.add(vId);
      payVisitorIds.add(vId);

      if (ev.variant && variantData[ev.variant]) {
        variantData[ev.variant].payClicks++;
      }

      const tot = Number(p.total || p.totalAmount || 0);
      totalRevenue += tot;
      orderCount++;

      campaignData[camp].pay.add(vId);
      campaignData[camp].revenue += tot;

      const items = p.items || (p.flavour ? [{ quantity: p.qty || 1, flavours: [p.flavour] }] : []);
      items.forEach((item) => {
        const qty = Number(item.quantity || 1);
        const flvs = item.flavours || [];
        flvs.forEach((fid) => {
          if (!tubeStats[fid]) {
            tubeStats[fid] = { id: fid, name: fid, local: "", hindi: "", cartAdds: 0, payClicks: 0, views: 0 };
          }
          tubeStats[fid].payClicks += qty;
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

      const nextFlv = p.nextFlavourWanted || p.nextWanted;
      if (nextFlv && nextTubeWanted[nextFlv] !== undefined) {
        nextTubeWanted[nextFlv]++;
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
          nextWanted: nextFlv,
          timestamp: ev.timestamp,
          paid: payVisitorIds.has(vId),
        });
      }
    }
  }

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

  // Top Tubes Table (sorted high to low: payClicks, then cartAdds)
  const topTubes = Object.values(tubeStats).sort((a, b) => {
    if (b.payClicks !== a.payClicks) {
      return b.payClicks - a.payClicks;
    }
    return b.cartAdds - a.cartAdds;
  });

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

  const variantsSummary = ["A", "B", "C"].map((v) => {
    const vd = variantData[v] || { visitors: new Set(), payClicks: 0 };
    const vis = vd.visitors.size;
    const pays = vd.payClicks;
    return {
      variant: v,
      visitors: vis,
      payClicks: pays,
      conversionRate: vis > 0 ? ((pays / vis) * 100).toFixed(1) + "%" : "0.0%",
    };
  });

  const surveyList = stoppedAnswers.slice().reverse();

  return {
    kpis: {
      visitors: allVisitors.size,
      addedToCartPct: totalV > 0 ? ((cartV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      startedCheckoutPct: totalV > 0 ? ((checkoutV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      pressedPayPct: totalV > 0 ? ((payV / totalV) * 100).toFixed(1) + "%" : "0.0%",
      launchSignups: signups.length,
      totalOrders: orderCount,
      totalRevenue: `₹${totalRevenue}`,
    },
    funnel,
    topTubes,
    sortedFlavours: topTubes.map((t) => ({
      id: t.id,
      name: t.name,
      local: t.local,
      orderedTubes: t.payClicks,
      cartAdds: t.cartAdds,
      views: t.views,
    })),
    notifyClicks,
    nextTubeWanted,
    campaignTable,
    tubeFeelings,
    packMix,
    frequencyCounts,
    variantsSummary,
    surveyResponses: surveyList,
    stoppedAnswers: surveyList,
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
  return result;
}

module.exports = {
  calculateDashboardMetrics,
  calculateMetrics,
  normalizeString,
};
