// Metrics & Funnel Calculation Engine

function calculateMetrics(events = []) {
  const visitorsSet = new Set();
  const visitorsByVariant = { A: new Set(), B: new Set(), C: new Set() };
  const visitorsBySource = {};

  const funnelVisitors = new Set();
  const funnelAddToCart = new Set();
  const funnelCheckout = new Set();
  const funnelPayClicked = new Set();

  const variantStats = {
    A: { visitors: new Set(), addToCart: new Set(), checkout: new Set(), payClicked: new Set(), singlePrice: 99, packPrice: 249 },
    B: { visitors: new Set(), addToCart: new Set(), checkout: new Set(), payClicked: new Set(), singlePrice: 149, packPrice: 349 },
    C: { visitors: new Set(), addToCart: new Set(), checkout: new Set(), payClicked: new Set(), singlePrice: 199, packPrice: 449 },
  };

  const flavourCounts = {
    tamarind: 0,
    "garlic-chilli": 0,
    "mint-coriander": 0,
  };

  const packCounts = {
    single: 0,
    three_pack: 0,
  };

  const pincodeStats = {
    deliverable: 0,
    outOfArea: 0,
    recentPincodes: [],
  };

  const paymentMethodChoices = {
    upi: 0,
    card: 0,
    cod: 0,
  };

  const surveyResponses = [];
  const frequencyCounts = {
    daily: 0,
    "few_times_a_week": 0,
    weekly: 0,
    rarely: 0,
  };

  let waitlistOptins = 0;

  for (const ev of events) {
    const { event, visitorId, variant, source, metadata = {}, timestamp } = ev;
    const vId = visitorId || "anon";
    const vVariant = (variant === "B" || variant === "C") ? variant : "A";
    const vSource = (source || "direct").toLowerCase();

    visitorsSet.add(vId);
    if (!visitorsBySource[vSource]) {
      visitorsBySource[vSource] = { visitors: new Set(), payClicks: new Set() };
    }
    visitorsBySource[vSource].visitors.add(vId);

    if (variantStats[vVariant]) {
      variantStats[vVariant].visitors.add(vId);
    }

    if (event === "page_view" || event === "scroll_50") {
      funnelVisitors.add(vId);
    } else if (event === "add_to_cart") {
      funnelVisitors.add(vId);
      funnelAddToCart.add(vId);
      if (variantStats[vVariant]) variantStats[vVariant].addToCart.add(vId);

      const f = metadata.flavour;
      if (f && flavourCounts[f] !== undefined) flavourCounts[f]++;
      const p = metadata.pack;
      if (p && packCounts[p] !== undefined) packCounts[p]++;
    } else if (event === "checkout_started") {
      funnelVisitors.add(vId);
      funnelCheckout.add(vId);
      if (variantStats[vVariant]) variantStats[vVariant].checkout.add(vId);
    } else if (event === "pincode_checked") {
      if (metadata.isDeliverable) {
        pincodeStats.deliverable++;
      } else {
        pincodeStats.outOfArea++;
      }
      if (metadata.pincode) {
        pincodeStats.recentPincodes.push({
          pincode: metadata.pincode,
          isDeliverable: metadata.isDeliverable,
          timestamp,
        });
      }
    } else if (event === "payment_method_selected") {
      const pm = (metadata.paymentMethod || "").toLowerCase();
      if (pm.includes("upi")) paymentMethodChoices.upi++;
      else if (pm.includes("card")) paymentMethodChoices.card++;
      else if (pm.includes("cod") || pm.includes("cash")) paymentMethodChoices.cod++;
    } else if (event === "pay_clicked") {
      funnelVisitors.add(vId);
      funnelPayClicked.add(vId);
      if (variantStats[vVariant]) variantStats[vVariant].payClicked.add(vId);
      visitorsBySource[vSource].payClicks.add(vId);
    } else if (event === "waitlist_optin") {
      waitlistOptins++;
    } else if (event === "survey_submitted") {
      if (metadata.feedback || metadata.frequency) {
        surveyResponses.push({
          visitorId: vId,
          feedback: metadata.feedback || "",
          frequency: metadata.frequency || "",
          contact: metadata.contact || "",
          optInDiscount: metadata.optInDiscount || false,
          timestamp,
        });
      }
      const freq = metadata.frequency;
      if (freq && frequencyCounts[freq] !== undefined) {
        frequencyCounts[freq]++;
      }
    }
  }

  // Calculate funnel conversions
  const vCount = Math.max(funnelVisitors.size, visitorsSet.size, 1);
  const cartCount = funnelAddToCart.size;
  const checkoutCount = funnelCheckout.size;
  const payCount = funnelPayClicked.size;

  const funnel = [
    { step: "1. Landed Visitors", count: vCount, pctOfTotal: 100, dropoffPct: 0 },
    {
      step: "2. Added to Cart",
      count: cartCount,
      pctOfTotal: Math.round((cartCount / vCount) * 100),
      conversionFromPrev: Math.round((cartCount / vCount) * 100),
    },
    {
      step: "3. Started Checkout",
      count: checkoutCount,
      pctOfTotal: Math.round((checkoutCount / vCount) * 100),
      conversionFromPrev: cartCount > 0 ? Math.round((checkoutCount / cartCount) * 100) : 0,
    },
    {
      step: "4. Pay Clicked (Intent Confirmed)",
      count: payCount,
      pctOfTotal: Math.round((payCount / vCount) * 100),
      conversionFromPrev: checkoutCount > 0 ? Math.round((payCount / checkoutCount) * 100) : 0,
    },
  ];

  // Formatted variants breakdown
  const variantsSummary = Object.keys(variantStats).map((vKey) => {
    const v = variantStats[vKey];
    const total = v.visitors.size;
    const pays = v.payClicked.size;
    const convRate = total > 0 ? ((pays / total) * 100).toFixed(1) : "0.0";
    return {
      variant: vKey,
      singlePrice: v.singlePrice,
      packPrice: v.packPrice,
      visitors: total,
      addToCart: v.addToCart.size,
      checkout: v.checkout.size,
      payClicks: pays,
      conversionRate: `${convRate}%`,
    };
  });

  // Sources breakdown
  const sourcesSummary = Object.keys(visitorsBySource).map((src) => {
    const s = visitorsBySource[src];
    const total = s.visitors.size;
    const pays = s.payClicks.size;
    const convRate = total > 0 ? ((pays / total) * 100).toFixed(1) : "0.0";
    return {
      source: src,
      visitors: total,
      payClicks: pays,
      conversionRate: `${convRate}%`,
    };
  });

  return {
    overview: {
      totalEvents: events.length,
      totalVisitors: visitorsSet.size,
      totalAddToCart: cartCount,
      totalCheckout: checkoutCount,
      totalPayClicked: payCount,
      overallConversionRate: `${((payCount / vCount) * 100).toFixed(1)}%`,
      waitlistOptins,
    },
    funnel,
    variantsSummary,
    sourcesSummary,
    flavourCounts,
    packCounts,
    pincodeStats,
    paymentMethodChoices,
    frequencyCounts,
    surveyResponses: surveyResponses.reverse(),
  };
}

module.exports = { calculateMetrics };
