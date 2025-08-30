import { normalizePhoneNumber } from './phone-number';

// Simple test to verify phone number normalization
console.log('🧪 Testing phone number normalization...');

const testCases = [
  '+19056992659',
  '19056992659', 
  '9056992659',
  '+19056992659',
  '1-905-699-2659',
  '(905) 699-2659',
  '905.699.2659'
];

testCases.forEach(phone => {
  const result = normalizePhoneNumber(phone);
  console.log(`📱 Input: ${phone}`);
  console.log(`   Variations: ${result.variations.join(', ')}`);
  console.log(`   Default: ${result.withPlusOne}`);
  console.log('');
});

// Expected output should show that all these formats generate similar variations
// and can match the existing customer with phone '9056992659'
