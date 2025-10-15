// Simple test script to verify bulk import functionality
const testImportData = [
  {
    spaceName: "Test Tank Room",
    building: "Test Building A",
    locationDescription: "Test Location Description",
    technician: "Test Technician",
    priority: "medium",
    status: "pending",
    surveyDate: "2024-01-15",
    confinedSpace: "Yes",
    permitRequired: "Yes",
    atmosphericHazard: "No",
    engulfmentHazard: "No",
    configurationHazard: "Yes",
    otherHazards: "No",
    ppeRequired: "Yes",
    airMonitorRequired: "Yes",
    warningSignPosted: "Yes",
    notes: "Test import from script"
  }
];

console.log('Test import data:');
console.log(JSON.stringify(testImportData, null, 2));

// Test the API endpoint
async function testBulkImport() {
  try {
    const response = await fetch('http://localhost:3012/api/orders/bulk/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      },
      body: JSON.stringify({ csvData: testImportData })
    });

    const result = await response.json();
    console.log('Import result:', result);
  } catch (error) {
    console.error('Import test failed:', error);
  }
}

// Uncomment to run the test
// testBulkImport();

module.exports = { testImportData };