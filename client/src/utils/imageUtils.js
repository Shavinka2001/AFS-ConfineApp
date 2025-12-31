// Image utility functions to handle CORS issues with Azure Blob Storage
export const getImageUrl = (url) => {
  if (!url) return '';

  // If it's already a proxy URL, return as is
  if (url.includes('/api/orders/proxy-image')) {
    return url;
  }

  // If it's an Azure blob storage URL, use the proxy
  if (url.includes('afsconfined.blob.core.windows.net')) {
    return `/api/orders/proxy-image?url=${encodeURIComponent(url)}`;
  }

  // Otherwise, return the URL as is
  return url;
};

export const getImageUrls = (urls) => {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => getImageUrl(url));
};