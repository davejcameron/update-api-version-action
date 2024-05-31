const fs = require('fs');
const core = require('@actions/core');
const toml = require('toml');
const tomlify = require('tomlify-j0.4');
const { execSync } = require('child_process');

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

try {
  // Find all shopify.extension.toml files in the repository
  const files = execSync('find . -name shopify.extension.toml').toString().split('\n').filter(f => f);
  
  // Update each found file
  files.forEach(filePath => {
    updateTomlFile(filePath);
  });

  // If no files were found, log a message
  if (!files.length) {
    console.log('No shopify.extension.toml files found.');
  }
} catch (error) {
  core.setFailed(error.message);
}

// Export functions for testing
module.exports = { getLatestApiVersion, updateTomlFile };