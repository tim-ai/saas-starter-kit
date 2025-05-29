const fs = require('fs').promises;
const path = require('path');

async function addUserBillingEnv() {
  const envPaths = ['.env', '.env.example', '.env.local'];

  for (const envPath of envPaths) {
    try {
      const fullPath = path.resolve(__dirname, '..', envPath);
      let content = await fs.readFile(fullPath, 'utf8');
      
      // Add feature flag if it doesn't exist
      if (!content.includes('STRIPE_USER_BILLING_ENABLED')) {
        content += '\n# User-level Stripe billing\nSTRIPE_USER_BILLING_ENABLED=false\n';
        await fs.writeFile(fullPath, content);
        console.log(`Added STRIPE_USER_BILLING_ENABLED to ${envPath}`);
      } else {
        console.log(`${envPath} already contains STRIPE_USER_BILLING_ENABLED`);
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`${envPath} not found, skipping...`);
      } else {
        console.error(`Error processing ${envPath}:`, error);
      }
    }
  }
}

addUserBillingEnv();