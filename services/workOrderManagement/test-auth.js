const jwt = require('jsonwebtoken');

// Simulate the workorder auth middleware test
const testWorkOrderAuth = () => {
  console.log('🧪 Testing WorkOrder Service Auth Middleware');
  
  // Create a test token with admin role
  const payload = {
    id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439011',
    role: 'admin',
    email: 'admin@confine.com',
    firstName: 'System',
    lastName: 'Administrator'
  };
  
  const token = jwt.sign(payload, 'your-secret-key', { expiresIn: '7d' });
  
  console.log('✅ Test token payload:', payload);
  console.log('✅ Test token (first 50 chars):', token.substring(0, 50) + '...');
  
  // Decode token to verify
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    console.log('✅ Token verification successful');
    console.log('✅ Decoded payload:', decoded);
    
    // Test role authorization
    const requiredRoles = ['admin', 'manager'];
    const hasPermission = requiredRoles.includes(decoded.role);
    
    console.log('\n🔐 Authorization Test:');
    console.log(`   User role: ${decoded.role}`);
    console.log(`   Required roles: ${requiredRoles.join(', ')}`);
    console.log(`   Has permission: ${hasPermission ? '✅ YES' : '❌ NO'}`);
    
    if (hasPermission) {
      console.log('\n🎉 Token should work for delete all operation!');
    } else {
      console.log('\n❌ Token will be rejected for delete all operation!');
    }
    
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
  }
};

testWorkOrderAuth();