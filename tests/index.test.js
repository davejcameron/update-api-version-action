const fs = require('fs');
const path = require('path');

// Mocking execSync for controlled test environment
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

const { getLatestApiVersion, updateTomlFile, runShopifyCommand, updateApiVersionsAndRunCommand } = require('../index');

describe('GitHub Action for Updating Shopify API Version', () => {

  beforeEach(() => {
    require('child_process').execSync.mockClear(); // Reset mock calls for each test
  });

  test('should get the latest API version', () => {
    const latestVersion = getLatestApiVersion();
    const today = new Date();
    const year = today.getUTCFullYear();

    const expectedQuarter = [1, 4, 7, 10][Math.floor(today.getUTCMonth() / 3)];
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
    const config = 'test_config';

    // Mocking the presence of environment variable
    process.env.SHOPIFY_CLI_PARTNERS_TOKEN = shopifyToken;
    process.env.INPUT_CONFIG = config;

    // Run the Shopify command
    runShopifyCommand(testDirPath, config);

    // Expect the execSync to be called with the correct command
    expect(require('child_process').execSync).toHaveBeenCalledWith(`shopify app function schema --path ${testDirPath} --config ${config}`, { stdio: 'inherit' });

    // Clean up the environment variable
    delete process.env.SHOPIFY_CLI_PARTNERS_TOKEN;
    delete process.env.INPUT_CONFIG;
  });

  test('should not run Shopify command if environment variable is not set', () => {
    const testDirPath = path.resolve(__dirname);
    const config = 'test_config';

    // Ensure the environment variable is not set
    delete process.env.SHOPIFY_CLI_PARTNERS_TOKEN;

    // Run the Shopify command
    runShopifyCommand(testDirPath, config);

    // Expect the execSync not to be called
    expect(require('child_process').execSync).not.toHaveBeenCalled();
  });

  test('should update all TOML files and run Shopify command if environment variable is set', () => {
    const testDirPath = path.resolve(__dirname);
    const shopifyToken = 'test_token';
    const config = 'test_config';

    // Mocking the presence of environment variable
    process.env.SHOPIFY_CLI_PARTNERS_TOKEN = shopifyToken;
    process.env.INPUT_CONFIG = config;

    // Create a test directory structure with TOML files
    const testFilePath1 = path.join(testDirPath, 'dir1/shopify.extension.toml');
    const testFilePath2 = path.join(testDirPath, 'dir2/shopify.extension.toml');
    fs.mkdirSync(path.dirname(testFilePath1), { recursive: true });
    fs.writeFileSync(testFilePath1, `
      name = "Test Extension"
      type = "product_discounts"
      api_version = "2022-10"
    `);
    fs.mkdirSync(path.dirname(testFilePath2), { recursive: true });
    fs.writeFileSync(testFilePath2, `
      name = "Test Extension"
      type = "product_discounts"
      api_version = "2022-10"
    `);

    // Run the command to update all files and run Shopify commands
    updateApiVersionsAndRunCommand(testDirPath, config);
    const latestVersion = getLatestApiVersion();

    // Check if files have been updated
    const updatedContent1 = fs.readFileSync(testFilePath1, 'utf-8');
    const updatedContent2 = fs.readFileSync(testFilePath2, 'utf-8');
    expect(updatedContent1).toContain(`api_version = "${latestVersion}"`);
    expect(updatedContent2).toContain(`api_version = "${latestVersion}"`);

    // Expect the execSync to be called twice (one for each file's directory)
    expect(require('child_process').execSync).toHaveBeenCalledTimes(2);

    // Clean up the environment variable
    delete process.env.SHOPIFY_CLI_PARTNERS_TOKEN;
    delete process.env.INPUT_CONFIG;

    // Clean up test files and directories
    fs.unlinkSync(testFilePath1);
    fs.unlinkSync(testFilePath2);
    fs.rmdirSync(path.join(testDirPath, 'dir1'));
    fs.rmdirSync(path.join(testDirPath, 'dir2'));
  });

});