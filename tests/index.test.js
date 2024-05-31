const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the functions you want to test
const { getLatestApiVersion, updateTomlFile } = require('../index');

describe('GitHub Action for Updating Shopify API Version', () => {

  test('should get the latest API version', () => {
    const latestVersion = getLatestApiVersion();
    const today = new Date();
    const year = today.getUTCFullYear();

    let expectedQuarter;
    if (today.getUTCMonth() < 3) {
      expectedQuarter = 1;
    } else if (today.getUTCMonth() < 6) {
      expectedQuarter = 4;
    } else if (today.getUTCMonth() < 9) {
      expectedQuarter = 7;
    } else {
      expectedQuarter = 10;
    }
    const expectedVersion = `${year}-${String(expectedQuarter).padStart(2, '0')}`;

    expect(latestVersion).toBe(expectedVersion);
  });

  test('should update the TOML file with the latest API version', () => {
    const testFilePath = path.join(__dirname, 'test_shopify.extension.toml');
    const originalContent = `
      name = "Test Extension"
      type = "product_discounts"
      api_version = "2022-10"

      [build]
      command = "cargo wasi build --release"
      path = "target/wasm32-wasi/release/test-extension.wasm"

      [ui.paths]
      create = "/test-extension/new"
      details = "/test-extension/:id"
    `;

    // Write the original content to the test file
    fs.writeFileSync(testFilePath, originalContent);

    // Call the function to update the TOML file
    updateTomlFile(testFilePath);
    const updatedContent = fs.readFileSync(testFilePath, 'utf-8');

    // Check if the file has been updated with the latest API version
    const latestVersion = getLatestApiVersion();
    expect(updatedContent).toContain(`api_version = "${latestVersion}"`);

    // Clean up the test file
    fs.unlinkSync(testFilePath);
  });
});