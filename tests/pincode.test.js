const { test, describe } = require("node:test");
const assert = require("node:assert");
const productConfig = require("../src/config/product.config.js");

describe("Pincode Validation Logic", () => {
  function checkPincode(pincode) {
    if (!pincode || typeof pincode !== "string") return false;
    const clean = pincode.trim().replace(/\D/g, "");
    return productConfig.launchPincodes.includes(clean);
  }

  test("Accurately identifies metro launch-city pincodes as deliverable", () => {
    assert.strictEqual(checkPincode("560001"), true, "Bengaluru Central should be deliverable");
    assert.strictEqual(checkPincode("400001"), true, "Mumbai Fort should be deliverable");
    assert.strictEqual(checkPincode("110001"), true, "New Delhi CP should be deliverable");
    assert.strictEqual(checkPincode("411001"), true, "Pune Station should be deliverable");
  });

  test("Accurately flags non-launch pincodes as out-of-area for waitlist routing", () => {
    assert.strictEqual(checkPincode("999999"), false);
    assert.strictEqual(checkPincode("123456"), false);
    assert.strictEqual(checkPincode(""), false);
    assert.strictEqual(checkPincode(null), false);
  });
});
