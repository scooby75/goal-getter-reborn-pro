
// Helper function to add cache busting parameter
export const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Generic fetch function with better error handling and CORS support
export const fetchCSVWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  console.log(`Attempting to fetch data from: ${url}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetch attempt ${attempt}/${maxRetries}`);
      
      // Try different approaches for each attempt
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,application/octet-stream,*/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors',
        credentials: 'omit'
      };

      // On second attempt, try without cache busting
      const fetchUrl = attempt === 1 ? addCacheBusting(url) : url;
      
      console.log(`Fetching from: ${fetchUrl}`);
      
      const response = await fetch(fetchUrl, fetchOptions);
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Empty response received');
      }
      
      console.log(`Successfully fetched ${csvText.length} characters from ${url} (attempt ${attempt})`);
      console.log('First 200 chars:', csvText.substring(0, 200));
      
      return csvText;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error);
      
      if (attempt === maxRetries) {
        // Try alternative URLs as fallback
        if (url.includes('raw.githubusercontent.com')) {
          console.log('Trying alternative GitHub raw URL...');
          try {
            const alternativeUrl = url.replace('raw.githubusercontent.com', 'github.com').replace('/refs/heads/main/', '/main/');
            const response = await fetch(alternativeUrl, {
              method: 'GET',
              headers: {
                'Accept': 'text/csv,text/plain,*/*'
              },
              mode: 'cors'
            });
            
            if (response.ok) {
              const csvText = await response.text();
              console.log('Alternative URL worked!');
              return csvText;
            }
          } catch (altError) {
            console.error('Alternative URL also failed:', altError);
          }
        }
        
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error(`Failed to fetch ${url}`);
};
