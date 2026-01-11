// ============================================================================
// VAPID KEY GENERATION SCRIPT
// ============================================================================
// Run this once to generate VAPID keys for Web Push API
// node scripts/generate-vapid-keys.js

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n==============================================');
console.log('VAPID KEYS GENERATED');
console.log('==============================================\n');
console.log('Add these to your .env file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n==============================================\n');
console.log('⚠️  IMPORTANT:');
console.log('- Keep the private key secret!');
console.log('- Never commit it to version control');
console.log('- The public key is safe to expose to clients');
console.log('==============================================\n');
