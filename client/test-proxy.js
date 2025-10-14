// Test script to check image proxy functionality
console.log('Testing image proxy...');

const testImageUrl = 'https://afsconfined.blob.core.windows.net/confined-space-images/temp-1757431045909-dda2be68-1385-49ab-b1b5-8b30f88dd5b4.jpg?sv=2025-07-05&se=2026-09-09T15%3A17%3A27Z&sr=b&sp=r&sig=Yc8lTIyuM92VzRPTAdor3JZI6leZv2kFZx5pkPGN6Nk%3D';

const proxyUrl = `http://localhost:3012/api/proxy-image?url=${encodeURIComponent(testImageUrl)}`;

fetch(proxyUrl)
  .then(response => {
    console.log('Proxy response status:', response.status);
    console.log('Proxy response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      return response.blob();
    } else {
      return response.text().then(text => {
        console.log('Error response:', text);
        throw new Error(`Proxy failed: ${response.status}`);
      });
    }
  })
  .then(blob => {
    console.log('Image blob size:', blob.size, 'bytes');
    console.log('Image blob type:', blob.type);
    console.log('✅ Proxy is working correctly!');
  })
  .catch(error => {
    console.error('❌ Proxy test failed:', error);
  });