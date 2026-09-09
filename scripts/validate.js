#!/usr/bin/env node

/**
 * Quick validation script to ensure core modules work
 */

console.log('🔍 Running Bridge validation checks...\n');

let errors = 0;
let warnings = 0;

// Test 1: Check required environment variables
console.log('1️⃣  Checking environment configuration...');
const requiredEnvVars = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const optionalEnvVars = ['OPENAI_API_KEY', 'TAVILY_API_KEY'];

require('dotenv').config();

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`   ❌ Missing required: ${varName}`);
    errors++;
  } else {
    console.log(`   ✓ Found: ${varName}`);
  }
});

optionalEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`   ⚠️  Optional not set: ${varName} (AI features will be limited)`);
    warnings++;
  } else {
    console.log(`   ✓ Found: ${varName}`);
  }
});

// Test 2: Validate TypeScript types
console.log('\n2️⃣  Validating TypeScript types...');
const { execSync } = require('child_process');
try {
  execSync('npm run typecheck', { stdio: 'pipe' });
  console.log('   ✓ TypeScript compilation passed');
} catch (error) {
  console.error('   ❌ TypeScript errors found');
  console.error(error.stdout?.toString());
  errors++;
}

// Test 3: Test mock data structure
console.log('\n3️⃣  Validating mock data...');
try {
  // This would require transpiling TS to JS, skip for now
  console.log('   ⚠️  Skipped (requires build)');
  warnings++;
} catch (error) {
  console.error('   ❌ Mock data validation failed:', error.message);
  errors++;
}

// Test 4: Check package dependencies
console.log('\n4️⃣  Checking critical dependencies...');
const criticalDeps = [
  '@supabase/supabase-js',
  'react-native-maps',
  'openai',
  'expo-router',
  'zustand',
];

const packageJson = require('../package.json');
criticalDeps.forEach((dep) => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✓ ${dep} installed`);
  } else {
    console.error(`   ❌ Missing critical dependency: ${dep}`);
    errors++;
  }
});

// Test 5: Check file structure
console.log('\n5️⃣  Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/ideas.tsx',
  'app/(tabs)/map.tsx',
  'app/(tabs)/memories.tsx',
  'app/(tabs)/settings.tsx',
  'src/lib/supabase.ts',
  'src/lib/aiExtraction.ts',
  'src/lib/dataService.ts',
  'src/store/useBridgeStore.ts',
  'src/types/bridge.ts',
];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.error(`   ❌ Missing file: ${file}`);
    errors++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Ready to run.');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  ${warnings} warning(s) - app will run with limited features`);
  process.exit(0);
} else {
  console.log(`❌ ${errors} error(s), ${warnings} warning(s) - fix errors before running`);
  process.exit(1);
}
