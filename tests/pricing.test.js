const { test, describe } = require("node:test");
const assert = require("node:assert");
const { storeConfig } = require("../src/config/store.js");

describe("Pricing Logic & Cart Calculations", () => {
  test("Product config should lock single tube price at 99 in store.js", () => {
    assert.strictEqual(storeConfig.pricing.singleTubePrice, 99);
  });

  test("Configures the 4 value packs with correct bundle pricing", () => {
    const packs = storeConfig.packs;
    assert.strictEqual(packs.length, 4);

    const chaatPair = packs.find((p) => p.id === "chaat-pair");
    assert.ok(chaatPair);
    assert.strictEqual(chaatPair.price, 179);
    assert.deepStrictEqual(chaatPair.flavourIds, ["hari-chutney", "imli-chutney"]);

    const desiChinesePair = packs.find((p) => p.id === "desi-chinese-pair");
    assert.ok(desiChinesePair);
    assert.strictEqual(desiChinesePair.price, 179);
    assert.deepStrictEqual(desiChinesePair.flavourIds, ["schezwan-sauce", "chilli-garlic"]);

    const mayoTrio = packs.find((p) => p.id === "mayo-trio");
    assert.ok(mayoTrio);
    assert.strictEqual(mayoTrio.price, 269);
    assert.deepStrictEqual(mayoTrio.flavourIds, ["tandoori-mayo", "mint-mayo", "garlic-mayo"]);

    const sampler8 = packs.find((p) => p.id === "sampler-8");
    assert.ok(sampler8);
    assert.strictEqual(sampler8.price, 699);
    assert.strictEqual(sampler8.flavourIds.length, 8);
  });

  test("Calculates correct cart totals for single tubes and packs", () => {
    function calculateCartTotal(cartItems) {
      return cartItems.reduce((acc, item) => {
        return acc + item.unitPrice * (item.quantity || 1);
      }, 0);
    }

    const testCart = [
      { id: "1", kind: "single", unitPrice: 99, quantity: 2 },
      { id: "2", kind: "pack", unitPrice: 179, quantity: 1 },
      { id: "3", kind: "pack", unitPrice: 699, quantity: 1 },
    ];

    assert.strictEqual(calculateCartTotal(testCart), 99 * 2 + 179 + 699);
  });
});
