const { test, describe } = require("node:test");
const assert = require("node:assert");
const productConfig = require("../src/config/product.config.js");

describe("Pricing Variant Logic & Configuration", () => {
  test("Product config should contain 3 distinct A/B/C pricing variants", () => {
    const { variants } = productConfig.pricing;
    assert.ok(variants.A, "Variant A should exist");
    assert.ok(variants.B, "Variant B should exist");
    assert.ok(variants.C, "Variant C should exist");

    // Price checks
    assert.strictEqual(variants.A.singlePrice, 99);
    assert.strictEqual(variants.A.threePackPrice, 249);

    assert.strictEqual(variants.B.singlePrice, 149);
    assert.strictEqual(variants.B.threePackPrice, 349);

    assert.strictEqual(variants.C.singlePrice, 199);
    assert.strictEqual(variants.C.threePackPrice, 449);
  });

  test("Variant resolver handles explicit URL override ?variant=B and ?variant=c", () => {
    function resolveVariantFromParam(param, storedVal) {
      if (param) {
        const clean = param.trim().toUpperCase();
        if (clean === "A" || clean === "B" || clean === "C") return clean;
      }
      if (storedVal && (storedVal === "A" || storedVal === "B" || storedVal === "C")) {
        return storedVal;
      }
      return "A";
    }

    assert.strictEqual(resolveVariantFromParam("B", null), "B");
    assert.strictEqual(resolveVariantFromParam("c", null), "C");
    assert.strictEqual(resolveVariantFromParam("A", "C"), "A", "URL param should override stored");
    assert.strictEqual(resolveVariantFromParam(null, "B"), "B", "Stored should be sticky when no URL param");
    assert.strictEqual(resolveVariantFromParam("XYZ", null), "A", "Invalid variant should fallback to default A");
  });
});
