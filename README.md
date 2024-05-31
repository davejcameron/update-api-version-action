# Update Shopify API Version Action

This GitHub Action automatically updates the API version in all `shopify.extension.toml` files within a repository to the latest API version based on the current date. The action can be configured to either commit changes directly or create a pull request.

## Features
- Automatically determines the latest Shopify API version based on the current date.
- Updates all `shopify.extension.toml` files within the repository.
- Includes unit tests to ensure the action works correctly.


## Example configuration

```yaml
name: Update Shopify API Version

on:
  schedule:
    - cron: '0 0 2 * *' # Runs at midnight on the second day of each month
  workflow_dispatch: # Allows manual triggering from the UI

jobs:
  update-version:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install Shopify CLI
        run: npm install -g @shopify/cli@latest

      - name: Update Shopify API version
        uses: davejcameron/update-api-version-action@main
        env:
          SHOPIFY_CLI_PARTNERS_TOKEN: ${{ secrets.SHOPIFY_CLI_PARTNERS_TOKEN }}
          SHOPIFY_API_KEY: ${{ secrets.SHOPIFY_API_KEY }} # App context to use

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: Update api version to latest 
          title: Update Shopify extensions API version
          branch: bump-shopify-api-version
```