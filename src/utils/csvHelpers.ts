
// Helper function to add cache busting parameter
export const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Generic fetch function with better error handling and CORS support
export const fetchCSVWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  console.log(`=== FETCH CSV WITH RETRY ===`);
  console.log(`Original URL: ${url}`);
  console.log(`Max retries: ${maxRetries}`);
  
  // Create multiple URL variations to try
  const urlVariations = [
    url,
    url.replace('refs/heads/main', 'main'),
    url.replace('/blob/', '/raw/'),
    'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/all_leagues_results.csv'
  ];
  
  console.log('URL variations to try:', urlVariations);
  
  for (let urlIndex = 0; urlIndex < urlVariations.length; urlIndex++) {
    const currentUrl = urlVariations[urlIndex];
    console.log(`\n=== TRYING URL ${urlIndex + 1}/${urlVariations.length} ===`);
    console.log(`URL: ${currentUrl}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for URL ${urlIndex + 1}`);
        
        // Different fetch strategies for each attempt
        const fetchOptions: RequestInit = {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,text/plain,application/octet-stream,*/*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (compatible; DataFetcher/1.0)'
          },
          mode: 'cors',
          credentials: 'omit'
        };

        // On first attempt, try with cache busting
        const fetchUrl = attempt === 1 ? addCacheBusting(currentUrl) : currentUrl;
        
        console.log(`Fetching from: ${fetchUrl}`);
        console.log(`Fetch options:`, JSON.stringify(fetchOptions, null, 2));
        
        const response = await fetch(fetchUrl, fetchOptions);
        
        console.log(`Response received:`);
        console.log(`- Status: ${response.status} ${response.statusText}`);
        console.log(`- OK: ${response.ok}`);
        console.log(`- Type: ${response.type}`);
        console.log(`- URL: ${response.url}`);
        
        const responseHeaders = Object.fromEntries(response.headers.entries());
        console.log(`- Headers:`, responseHeaders);
        
        if (!response.ok) {
          console.warn(`HTTP Error: ${response.status} ${response.statusText}`);
          if (response.status === 404) {
            console.log('404 error - trying next URL variation...');
            break; // Try next URL variation
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        console.log(`Response text received:`);
        console.log(`- Length: ${csvText.length} characters`);
        console.log(`- First 500 chars:`, csvText.substring(0, 500));
        console.log(`- Contains headers: ${csvText.includes('Date') || csvText.includes('Team')}`);
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('Empty response received');
        }
        
        // Basic validation - check if it looks like CSV
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('Response does not appear to be valid CSV (less than 2 lines)');
        }
        
        console.log(`✅ SUCCESS! Fetched CSV from ${currentUrl} (attempt ${attempt})`);
        console.log(`Lines in CSV: ${lines.length}`);
        
        return csvText;
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed for URL ${urlIndex + 1}:`, error);
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error('Network error detected - possibly CORS or connectivity issue');
        }
        
        if (attempt === maxRetries) {
          console.log(`All attempts failed for URL ${urlIndex + 1}, trying next URL...`);
          break; // Try next URL variation
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // If all URLs failed, try a direct approach without CORS
  console.log('\n=== FINAL FALLBACK ATTEMPT ===');
  try {
    console.log('Trying simplified fetch without CORS restrictions...');
    const response = await fetch('https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/all_leagues_results.csv', {
      method: 'GET',
      mode: 'no-cors'
    });
    
    console.log('No-CORS response:', response);
    if (response.type === 'opaque') {
      console.error('Received opaque response - CORS is blocking the request');
    }
  } catch (fallbackError) {
    console.error('Fallback attempt also failed:', fallbackError);
  }
  
  console.log('\n=== DEBUGGING INFORMATION ===');
  console.log('Browser:', navigator.userAgent);
  console.log('Location:', window.location.href);
  console.log('Protocol:', window.location.protocol);
  
  const finalError = new Error(
    `Failed to fetch CSV data from any of the attempted URLs. This appears to be a CORS or network connectivity issue. URLs tried: ${urlVariations.join(', ')}`
  );
  
  console.error('=== FINAL ERROR ===', finalError);
  throw finalError;
};
