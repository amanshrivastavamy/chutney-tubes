const { test, describe } = require("node:test");
const assert = require("node:assert");

describe("Event Logging & Payload Validation", () => {
  const REQUIRED_EVENTS = [
    "page_view",
    "scroll_50",
    "flavour_selected",
    "add_to_cart",
    "checkout_started",
    "pincode_checked",
    "payment_method_selected",
    "pay_clicked",
    "waitlist_optin",
    "survey_submitted",
  ];

  function createEventPayload(event, { visitorId, variant, source, metadata }) {
    if (!REQUIRED_EVENTS.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
    return {
      event,
      timestamp: new Date().toISOString(),
      visitorId: visitorId || "vis_test123",
      variant: (variant === "B" || variant === "C") ? variant : "A",
      source: (source || "direct").toLowerCase(),
      metadata: metadata || {},
    };
  }

  test("Validates all 10 required demand test events", () => {
    REQUIRED_EVENTS.forEach((evt) => {
      const payload = createEventPayload(evt, {
        visitorId: "vis_user_456",
        variant: "B",
        source: "whatsapp",
        metadata: { flavour: "mint-coriander" },
      });

      assert.strictEqual(payload.event, evt);
      assert.ok(payload.timestamp, "Must contain timestamp");
      assert.strictEqual(payload.visitorId, "vis_user_456");
      assert.strictEqual(payload.variant, "B");
      assert.strictEqual(payload.source, "whatsapp");
    });
  });

  test("Rejects or flags unlisted event names", () => {
    assert.throws(() => {
      createEventPayload("unknown_event", {});
    }, /Invalid event type/);
  });

  test("Extracts traffic source correctly", () => {
    function resolveSource(queryParam, referrer) {
      if (queryParam) return queryParam.trim().toLowerCase();
      if (referrer && referrer.includes("instagram.com")) return "instagram";
      if (referrer && referrer.includes("whatsapp.com")) return "whatsapp";
      return "direct";
    }

    assert.strictEqual(resolveSource("office-slack", null), "office-slack");
    assert.strictEqual(resolveSource(null, "https://l.instagram.com/"), "instagram");
    assert.strictEqual(resolveSource(null, "https://api.whatsapp.com/"), "whatsapp");
    assert.strictEqual(resolveSource(null, ""), "direct");
  });
});
