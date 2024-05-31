const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getLatestApiVersion, updateTomlFile, runShopifyCommand } = require('../index');

// Mocking execSync for controlled test environment
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

describe('GitHub Action for Updating Shopify API Version', () => {

  beforeEach(() => {
    require('child_process').execSync.mockClear(); // Reset mock calls for each test
  });

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

  test('should run Shopify command if environment variable is set', () => {
    const testDirPath = path.resolve(__dirname);
    const shopifyToken = 'test_token';

    // Mocking the presence of environment variable
    process.env.SHOPIFY_CLI_PARTNERS_TOKEN = shopifyToken;

    // Run the Shopify command
    runShopifyCommand(testDirPath);

    // Expect the execSync to be called with the correct command
    expect(require('child_process').execSync).toHaveBeenCalledWith(`shopify app function schema --path ${testDirPath}`, { stdio: 'inherit' });

    // Clean up the environment variable
    delete process.env.SHOPIFY_CLI_PARTNERS_TOKEN;
  });

  test('should not run Shopify command if environment variable is not set', () => {
    const testDirPath = path.resolve(__dirname);

    // Ensure the environment variable is not set
    delete process.env.SHOPIFY_CLI_PARTNERS_TOKEN;

    // Run the Shopify command
    runShopifyCommand(testDirPath);

    // Expect the execSync not to be called
    expect(require('child_process').execSync).not.toHaveBeenCalledWith(`shopify app function schema --path ${testDirPath}`, { stdio: 'inherit' });
  });

});