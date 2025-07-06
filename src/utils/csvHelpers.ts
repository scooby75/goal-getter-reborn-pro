// Helper function to add cache busting parameter
export const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Lista segura de URLs RAW
const RAW_GITHUB_URLS = [
  'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/all_leagues_results.csv',
];

// Função para buscar CSV com tentativas e melhor tratamento de erro
export const fetchCSVWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  console.log('=== FETCH CSV WITH RETRY ===');
  console.log('Original URL:', url);
  console.log('Max retries:', maxRetries);

  const urlVariations = Array.from(new Set([
    addCacheBusting(url),
    ...RAW_GITHUB_URLS.map(addCacheBusting),
  ]));

  console.log('URL variations to try:', urlVariations);

  for (const currentUrl of urlVariations) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n🟡 Attempt ${attempt}/${maxRetries} to fetch: ${currentUrl}`);

        const response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,text/plain,*/*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }

        const csvText = await response.text();

        if (!csvText || csvText.trim().length < 10) {
          throw new Error('CSV appears to be empty or malformed.');
        }

        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV does not have enough lines.');
        }

        console.log(`✅ Successfully fetched CSV with ${lines.length} lines from ${currentUrl}`);
        return csvText;
      } catch (error) {
        console.warn(`❌ Failed on attempt ${attempt}:`, error);

        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
  }

  // Final error after all retries
  const finalError = new Error(
    `Failed to fetch CSV data from all attempted URLs. Possible CORS or network issue.\nTried: ${urlVariations.join(', ')}`
  );
  console.error('🔥 FINAL ERROR:', finalError);
  throw finalError;
};
