const fs = require('fs');
const core = require('@actions/core');
const toml = require('toml');
const tomlify = require('tomlify-j0.4');
const { execSync } = require('child_process');
const path = require('path');

function getLatestApiVersion() {
  const today = new Date();
  const year = today.getUTCFullYear();

  // Determine the quarter
  let quarter;
  if (today.getUTCMonth() < 3) {
    quarter = 1;
  } else if (today.getUTCMonth() < 6) {
    quarter = 4;
  } else if (today.getUTCMonth() < 9) {
    quarter = 7;
  } else {
    quarter = 10;
  }

  // Construct the latest API version
  return `${year}-${String(quarter).padStart(2, '0')}`;
}

function updateTomlFile(filePath) {
  // Read the toml file
  const tomlContent = fs.readFileSync(filePath, 'utf-8');
  const parsedToml = toml.parse(tomlContent);

  // Get the latest API version
  const latestApiVersion = getLatestApiVersion();

  // Update the api_version in the parsed TOML content
  parsedToml.api_version = latestApiVersion;

  // Convert the updated object back to TOML
  const updatedTomlContent = tomlify.toToml(parsedToml, {});

  // Write the updated TOML back to the file
  fs.writeFileSync(filePath, updatedTomlContent);
  console.log(`Updated ${filePath} with the latest API version: ${latestApiVersion}`);
}

function runShopifyCommand(dirPath) {
  if (process.env.SHOPIFY_CLI_PARTNERS_TOKEN) {
    execSync(`shopify app function schema --path ${dirPath}`, { stdio: 'inherit' });
  }
}

try {
  // Find all modified shopify.extension.toml files in the repository
  const modifiedFiles = execSync('git diff --name-only HEAD~1 HEAD').toString().split('\n').filter(f => f.endsWith('shopify.extension.toml'));

  // Check if the environment variable is set
  const shopifyToken = process.env.SHOPIFY_CLI_PARTNERS_TOKEN;

  // Update each found file and run the Shopify command if the ENV is set
  modifiedFiles.forEach(filePath => {
    updateTomlFile(filePath);

    if (shopifyToken) {
      const directoryPath = path.dirname(filePath);
      runShopifyCommand(directoryPath);
    }
  });

  // If no files were found, log a message
  if (!modifiedFiles.length) {
    console.log('No modified shopify.extension.toml files found.');
  }
} catch (error) {
  core.setFailed(`Action failed with error: ${error.message}`);
}

// Export functions for testing
module.exports = { getLatestApiVersion, updateTomlFile, runShopifyCommand };