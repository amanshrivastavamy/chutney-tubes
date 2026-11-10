const { test, describe } = require("node:test");
const assert = require("node:assert");
const { calculateMetrics } = require("../src/lib/metrics.js");

describe("Funnel & Metrics Calculations", () => {
  const sampleEvents = [
    // Visitor 1: Full conversion on Variant A via WhatsApp
    { event: "page_view", visitorId: "v1", variant: "A", source: "whatsapp", timestamp: "2026-11-10T10:00:00Z" },
    { event: "flavour_selected", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { flavour: "mint-coriander" }, timestamp: "2026-11-10T10:01:00Z" },
    { event: "add_to_cart", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { flavour: "mint-coriander", pack: "single" }, timestamp: "2026-11-10T10:01:30Z" },
    { event: "checkout_started", visitorId: "v1", variant: "A", source: "whatsapp", timestamp: "2026-11-10T10:02:00Z" },
    { event: "pincode_checked", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { pincode: "560001", isDeliverable: true }, timestamp: "2026-11-10T10:02:15Z" },
    { event: "payment_method_selected", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { paymentMethod: "upi" }, timestamp: "2026-11-10T10:02:30Z" },
    { event: "pay_clicked", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { totalAmount: 99 }, timestamp: "2026-11-10T10:03:00Z" },
    { event: "survey_submitted", visitorId: "v1", variant: "A", source: "whatsapp", metadata: { feedback: "No issues, looks great", frequency: "daily" }, timestamp: "2026-11-10T10:03:30Z" },

    // Visitor 2: Dropoff at checkout on Variant B via Instagram
    { event: "page_view", visitorId: "v2", variant: "B", source: "instagram", timestamp: "2026-11-10T10:10:00Z" },
    { event: "add_to_cart", visitorId: "v2", variant: "B", source: "instagram", metadata: { flavour: "garlic-chilli", pack: "single" }, timestamp: "2026-11-10T10:11:00Z" },
    { event: "checkout_started", visitorId: "v2", variant: "B", source: "instagram", timestamp: "2026-11-10T10:11:30Z" },

    // Visitor 3: Dropoff at landing on Variant C via Direct
    { event: "page_view", visitorId: "v3", variant: "C", source: "direct", timestamp: "2026-11-10T10:20:00Z" },
    { event: "scroll_50", visitorId: "v3", variant: "C", source: "direct", timestamp: "2026-11-10T10:20:15Z" },
  ];

  test("Computes correct funnel stage counts", () => {
    const metrics = calculateMetrics(sampleEvents);

    assert.strictEqual(metrics.overview.totalVisitors, 3, "Total unique visitors should be 3");
    assert.strictEqual(metrics.overview.totalAddToCart, 2, "2 visitors added to cart");
    assert.strictEqual(metrics.overview.totalCheckout, 2, "2 visitors started checkout");
    assert.strictEqual(metrics.overview.totalPayClicked, 1, "1 visitor completed pay click");

    // Funnel steps
    assert.strictEqual(metrics.funnel[0].count, 3);
    assert.strictEqual(metrics.funnel[1].count, 2);
    assert.strictEqual(metrics.funnel[2].count, 2);
    assert.strictEqual(metrics.funnel[3].count, 1);
  });

  test("Computes variant breakdown accurately", () => {
    const metrics = calculateMetrics(sampleEvents);
    const varA = metrics.variantsSummary.find((v) => v.variant === "A");
    const varB = metrics.variantsSummary.find((v) => v.variant === "B");
    const varC = metrics.variantsSummary.find((v) => v.variant === "C");

    assert.strictEqual(varA.visitors, 1);
    assert.strictEqual(varA.payClicks, 1);
    assert.strictEqual(varA.conversionRate, "100.0%");

    assert.strictEqual(varB.visitors, 1);
    assert.strictEqual(varB.payClicks, 0);

    assert.strictEqual(varC.visitors, 1);
    assert.strictEqual(varC.payClicks, 0);
  });

  test("Aggregates qualitative survey answers", () => {
    const metrics = calculateMetrics(sampleEvents);
    assert.strictEqual(metrics.surveyResponses.length, 1);
    assert.strictEqual(metrics.surveyResponses[0].feedback, "No issues, looks great");
    assert.strictEqual(metrics.surveyResponses[0].frequency, "daily");
  });
});
