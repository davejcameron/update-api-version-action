const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TOML = require('@iarna/toml');

function getLatestApiVersion() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const quarters = [1, 4, 7, 10];
  const quarter = quarters[Math.floor(today.getUTCMonth() / 3)];
  return `${year}-${String(quarter).padStart(2, '0')}`;
}

function updateTomlFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsedToml = TOML.parse(content);
  parsedToml.api_version = getLatestApiVersion();
  const updatedToml = TOML.stringify(parsedToml);
  fs.writeFileSync(filePath, updatedToml, 'utf8');
}

function runShopifyCommand(dirPath) {
  if (process.env.SHOPIFY_CLI_PARTNERS_TOKEN) {
    execSync(`shopify app function schema --path ${dirPath}`, { stdio: 'inherit' });
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

module.exports = { getLatestApiVersion, updateTomlFile, runShopifyCommand, updateApiVersionsAndRunCommand };