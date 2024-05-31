const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TOML = require('@iarna/toml');

function getLatestApiVersion() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const quarters = [1, 4, 7, 10];
  const quarter = quarters[Math.floor(today.getUTCMonth() / 3)];
  const latestVersion = `${year}-${String(quarter).padStart(2, '0')}`;
  console.log(`Latest API Version determined: ${latestVersion}`);
  return latestVersion;
}

function updateTomlFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsedToml = TOML.parse(content);
    const latestVersion = getLatestApiVersion();
    parsedToml.api_version = latestVersion;
    const updatedToml = TOML.stringify(parsedToml);
    fs.writeFileSync(filePath, updatedToml, 'utf8');
    console.log(`Updated API version in ${filePath} to ${latestVersion}`);
  } catch (error) {
    console.error(`Error updating TOML file: ${error.message}`);
  }
}

function runShopifyCommand(dirPath) {
  if (process.env.SHOPIFY_CLI_PARTNERS_TOKEN) {
    try {
      execSync(`shopify app function schema --path ${dirPath}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error running Shopify command in ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`SHOPIFY_CLI_PARTNERS_TOKEN is not set. Skipping Shopify command in ${dirPath}`);
  }
}

function findTomlFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findTomlFiles(fullPath));
    } else if (file === 'shopify.extension.toml') {
      results.push(fullPath);
    }
  }
  return results;
}

function updateApiVersionsAndRunCommand(baseDir) {
  const tomlFiles = findTomlFiles(baseDir);
  for (const tomlFile of tomlFiles) {
    updateTomlFile(tomlFile);
    runShopifyCommand(path.dirname(tomlFile));
  }
}

updateApiVersionsAndRunCommand(process.cwd());

module.exports = { getLatestApiVersion, updateTomlFile, runShopifyCommand, updateApiVersionsAndRunCommand };