const { test, describe } = require("node:test");
const assert = require("node:assert");
const { getPostalZone, isValidPincode, storeConfig } = require("../src/config/store.js");

describe("Pincode & Region Validation Logic", () => {
  test("Validates 6-digit Indian PIN codes starting with digits 1 through 8", () => {
    assert.strictEqual(isValidPincode("110001"), true, "Delhi should be deliverable (Region 1)");
    assert.strictEqual(isValidPincode("201301"), true, "Noida should be deliverable (Region 2)");
    assert.strictEqual(isValidPincode("380001"), true, "Ahmedabad should be deliverable (Region 3)");
    assert.strictEqual(isValidPincode("400001"), true, "Mumbai should be deliverable (Region 4)");
    assert.strictEqual(isValidPincode("560001"), true, "Bengaluru should be deliverable (Region 5)");
    assert.strictEqual(isValidPincode("600001"), true, "Chennai should be deliverable (Region 6)");
    assert.strictEqual(isValidPincode("700001"), true, "Kolkata should be deliverable (Region 7)");
    assert.strictEqual(isValidPincode("800001"), true, "Patna should be deliverable (Region 8)");
  });

  test("Rejects invalid pincodes (invalid prefixes, lengths, or non-numeric characters)", () => {
    assert.strictEqual(isValidPincode("999999"), false, "Prefix 9 is reserved (Army Postal Service)");
    assert.strictEqual(isValidPincode("012345"), false, "Prefix 0 is invalid in India");
    assert.strictEqual(isValidPincode("5600"), false, "Too short");
    assert.strictEqual(isValidPincode("5600012"), false, "Too long");
    assert.strictEqual(isValidPincode("56000A"), false, "Contains non-numeric character");
    assert.strictEqual(isValidPincode(""), false, "Empty string");
    assert.strictEqual(isValidPincode(null), false, "Null value");
    assert.strictEqual(isValidPincode(undefined), false, "Undefined value");
  });

  test("Accurately maps PIN codes to correct geographical regions from storeConfig", () => {
    assert.strictEqual(getPostalZone("110001"), storeConfig.postalZones["1"]);
    assert.strictEqual(getPostalZone("201301"), storeConfig.postalZones["2"]);
    assert.strictEqual(getPostalZone("380001"), storeConfig.postalZones["3"]);
    assert.strictEqual(getPostalZone("400001"), storeConfig.postalZones["4"]);
    assert.strictEqual(getPostalZone("560001"), storeConfig.postalZones["5"]);
    assert.strictEqual(getPostalZone("600001"), storeConfig.postalZones["6"]);
    assert.strictEqual(getPostalZone("700001"), storeConfig.postalZones["7"]);
    assert.strictEqual(getPostalZone("800001"), storeConfig.postalZones["8"]);
    assert.strictEqual(getPostalZone("999999"), "India");
    assert.strictEqual(getPostalZone(""), "Unknown");
    assert.strictEqual(getPostalZone(null), "Unknown");
  });
});
