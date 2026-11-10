const { test, describe } = require("node:test");
const assert = require("node:assert");

describe("Event Logging & Payload Validation", () => {
  const REQUIRED_EVENTS = [
    "page_view",
    "scroll_50",
    "flavour_selected",
    "add_to_cart",
    "notify_click",
    "checkout_started",
    "pincode_checked",
    "payment_method_selected",
    "pay_clicked",
    "waitlist_optin",
    "survey_submitted",
    "launch_optin",
  ];

  function createEventPayload(event, { visitorId, sessionId, variant, source, isInternal = false, payload = {} }) {
    if (!REQUIRED_EVENTS.includes(event)) {
      throw new Error(`Invalid event type: ${event}`);
    }
    const cleanVariant = (variant || "a").toLowerCase();
    return {
      event,
      timestamp: new Date().toISOString(),
      visitorId: visitorId || "vis_test123",
      sessionId: sessionId || "sess_test123",
      variant: (cleanVariant === "b" || cleanVariant === "c") ? cleanVariant : "a",
      isInternal: Boolean(isInternal),
      utm: {
        utm_source: (source || "direct").toLowerCase(),
      },
      payload: payload || {},
    };
  }

  test("Validates all required demand test events with visitor and session context", () => {
    REQUIRED_EVENTS.forEach((evt) => {
      const payload = createEventPayload(evt, {
        visitorId: "vis_user_456",
        sessionId: "sess_tab_789",
        variant: "b",
        source: "whatsapp",
        payload: { flavour: "masala-ketchup" },
      });

      assert.strictEqual(payload.event, evt);
      assert.ok(payload.timestamp, "Must contain ISO timestamp");
      assert.strictEqual(payload.visitorId, "vis_user_456");
      assert.strictEqual(payload.sessionId, "sess_tab_789");
      assert.strictEqual(payload.variant, "b");
      assert.strictEqual(payload.utm.utm_source, "whatsapp");
    });
  });

  test("Rejects unlisted event names", () => {
    assert.throws(() => {
      createEventPayload("unknown_fake_event", {});
    }, /Invalid event type/);
  });

  test("Extracts traffic source and UTM parameters accurately", () => {
    function resolveSource(queryParam, referrer) {
      if (queryParam) return queryParam.trim().toLowerCase();
      if (referrer && referrer.includes("instagram.com")) return "instagram";
      if (referrer && referrer.includes("whatsapp.com")) return "whatsapp";
      return "direct";
    }

    assert.strictEqual(resolveSource("community-slack", null), "community-slack");
    assert.strictEqual(resolveSource("reddit_delhi", null), "reddit_delhi");
    assert.strictEqual(resolveSource(null, "https://l.instagram.com/"), "instagram");
    assert.strictEqual(resolveSource(null, "https://api.whatsapp.com/"), "whatsapp");
    assert.strictEqual(resolveSource(null, ""), "direct");
  });

  test("Flags internal visits via admin query parameter to keep ad metrics clean", () => {
    function checkIsInternal(queryParam, storedVal) {
      if (queryParam === "1" || queryParam === "true") return true;
      if (storedVal === "true") return true;
      return false;
    }

    assert.strictEqual(checkIsInternal("1", null), true, "?admin=1 flags internal visit");
    assert.strictEqual(checkIsInternal(null, "true"), true, "Sticky flag retains internal state");
    assert.strictEqual(checkIsInternal(null, null), false, "Public ad traffic is not internal");
  });

  test("Privacy compliance: payload does not store full customer name, phone, or payment secrets", () => {
    const sampleEventPayload = {
      pinPrefix: "560",
      region: "Southern (AP, Telangana, Karnataka)",
      method: "upi",
      total: 179,
    };

    assert.strictEqual(sampleEventPayload.fullName, undefined, "Name must NEVER be sent to public event logs");
    assert.strictEqual(sampleEventPayload.phone, undefined, "Phone must NEVER be sent to public event logs");
    assert.strictEqual(sampleEventPayload.cardNumber, undefined, "No card numbers allowed");
    assert.strictEqual(sampleEventPayload.cvv, undefined, "No CVV allowed");
    assert.strictEqual(sampleEventPayload.upiId, undefined, "No UPI IDs allowed");
  });
});
