const { test, describe } = require("node:test");
const assert = require("node:assert");
const { storeConfig } = require("../src/config/store.js");

describe("Pricing Variant Logic & Cart Calculations", () => {
  test("Product config should contain 3 distinct A/B/C pricing tiers in store.js", () => {
    const { variants, defaultVariant } = storeConfig.pricing;
    assert.strictEqual(defaultVariant, "a");
    assert.ok(variants.a, "Variant A should exist");
    assert.ok(variants.b, "Variant B should exist");
    assert.ok(variants.c, "Variant C should exist");

    // Tier A
    assert.strictEqual(variants.a.single, 99);
    assert.strictEqual(variants.a.combo, 179);
    assert.strictEqual(variants.a.pick3, 269);

    // Tier B
    assert.strictEqual(variants.b.single, 149);
    assert.strictEqual(variants.b.combo, 279);
    assert.strictEqual(variants.b.pick3, 399);

    // Tier C
    assert.strictEqual(variants.c.single, 199);
    assert.strictEqual(variants.c.combo, 369);
    assert.strictEqual(variants.c.pick3, 529);
  });

  test("Variant resolver handles explicit URL override ?variant=b and ?variant=C", () => {
    function resolveVariant(param, storedVal) {
      if (param) {
        const clean = param.trim().toLowerCase();
        if (clean === "a" || clean === "b" || clean === "c") return clean;
      }
      if (storedVal) {
        const cleanStored = storedVal.trim().toLowerCase();
        if (cleanStored === "a" || cleanStored === "b" || cleanStored === "c") {
          return cleanStored;
        }
      }
      return storeConfig.pricing.defaultVariant || "a";
    }

    assert.strictEqual(resolveVariant("b", null), "b");
    assert.strictEqual(resolveVariant("C", null), "c");
    assert.strictEqual(resolveVariant("A", "c"), "a", "URL param should override stored");
    assert.strictEqual(resolveVariant(null, "b"), "b", "Stored should be sticky when no URL param");
    assert.strictEqual(resolveVariant("XYZ", null), "a", "Invalid variant should fallback to default a");
    assert.strictEqual(resolveVariant(null, null), "a", "Fallback to default a when neither provided");
  });

  test("Calculates correct cart totals across single, combo, and pick3 packs", () => {
    function calculateCartTotal(cartItems, variant = "a") {
      const pricing = storeConfig.pricing.variants[variant] || storeConfig.pricing.variants.a;
      return cartItems.reduce((acc, item) => {
        let unitPrice = 0;
        if (item.kind === "single") unitPrice = pricing.single;
        else if (item.kind === "combo") unitPrice = pricing.combo;
        else if (item.kind === "pick3") unitPrice = pricing.pick3;
        return acc + unitPrice * (item.quantity || 1);
      }, 0);
    }

    // Variant A
    assert.strictEqual(calculateCartTotal([{ kind: "single", quantity: 1 }], "a"), 99);
    assert.strictEqual(calculateCartTotal([{ kind: "single", quantity: 2 }], "a"), 198);
    assert.strictEqual(calculateCartTotal([{ kind: "combo", quantity: 1 }], "a"), 179);
    assert.strictEqual(calculateCartTotal([{ kind: "pick3", quantity: 1 }], "a"), 269);

    // Variant B mixed cart
    const mixedCartB = [
      { kind: "single", quantity: 1 },
      { kind: "combo", quantity: 1 },
    ];
    assert.strictEqual(calculateCartTotal(mixedCartB, "b"), 149 + 279); // 428

    // Variant C
    assert.strictEqual(calculateCartTotal([{ kind: "pick3", quantity: 2 }], "c"), 529 * 2); // 1058
  });
});
