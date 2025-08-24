// Test 0.001 ETH parsing and validation
console.log('=== Testing 0.001 ETH Donation Logic ===');

// Test 1: String to float conversion
const testAmount = "0.001";
const parsedAmount = parseFloat(testAmount);

console.log('\n1. Basic Parsing:');
console.log('Input:', testAmount, '(type:', typeof testAmount, ')');
console.log('Parsed:', parsedAmount, '(type:', typeof parsedAmount, ')');
console.log('isNaN:', isNaN(parsedAmount));

// Test 2: Validation logic
console.log('\n2. Validation Logic:');
console.log('!testAmount:', !testAmount);
console.log('isNaN(parsedAmount):', isNaN(parsedAmount));
console.log('parsedAmount < 0.001:', parsedAmount < 0.001);
console.log('parsedAmount >= 0.001:', parsedAmount >= 0.001);

// Test 3: Condition that would cause validation to fail
const shouldPass = !(!testAmount || isNaN(parsedAmount) || parsedAmount < 0.001);
console.log('\n3. Overall Validation:');
console.log('Should pass validation:', shouldPass);

// Test 4: Edge cases
console.log('\n4. Edge Cases:');
const testCases = ["0.001", "0.0010", "0.001000", ".001", "0.0009", "0.002"];
testCases.forEach(test => {
    const parsed = parseFloat(test);
    const passes = !(parsed < 0.001);
    console.log(`${test} -> ${parsed} -> ${passes ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 5: ethers.js parsing
console.log('\n5. Ethers.js Simulation:');
try {
    // Simulate ethers.parseEther
    const weiValue = BigInt(Math.round(parsedAmount * 1e18));
    console.log('Wei value:', weiValue.toString());
    console.log('Back to ETH:', Number(weiValue) / 1e18);
} catch (error) {
    console.log('Ethers simulation error:', error.message);
}

console.log('\n=== Test Complete ===');
console.log('Expected: 0.001 ETH should PASS validation');
console.log('Result:', shouldPass ? '✅ WORKING' : '❌ BROKEN');