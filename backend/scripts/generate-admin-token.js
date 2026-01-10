/**
 * Generate admin auth token for testing purposes
 * Usage: node scripts/generate-admin-token.js <telegram_username>
 */

const jwt = require('jsonwebtoken');

const username = process.argv[2] || 'maksim_tereshin';
const secret = process.env.JWT_SECRET || 'your-secret-key-replace-in-production';

const payload = {
  username: username,
  role: 'admin',
};

const token = jwt.sign(payload, secret, {
  expiresIn: '15m',
});

console.log('\n🔑 Admin Token Generated:\n');
console.log(token);
console.log('\n🌐 Admin Panel URL:\n');
console.log(`http://localhost:3001/admin?token=${token}`);
console.log('\n✅ Token valid for 15 minutes\n');
