
// Helper function to add cache busting parameter
export const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Generic fetch function with better error handling
export const fetchCSVWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  const urlWithCacheBusting = addCacheBusting(url);
  console.log(`Fetching data from: ${urlWithCacheBusting}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(urlWithCacheBusting, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`Data fetched successfully from ${url} (attempt ${attempt})`);
      return csvText;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to fetch ${url}`);
};
