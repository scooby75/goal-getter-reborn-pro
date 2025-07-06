// Gera uma URL com parâmetro anti-cache (_t=timestamp)
export const addCacheBusting = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};

// Lista de URLs RAW do GitHub confiáveis
const RAW_GITHUB_URLS = [
  'https://raw.githubusercontent.com/scooby75/goal-getter-reborn-pro/main/public/Data/all_leagues_results.csv',
];

// Função que tenta buscar o CSV com múltiplas URLs e tentativas
export const fetchCSVWithRetry = async (
  url: string,
  maxRetries = 3
): Promise<string> => {
  console.log('=== FETCH CSV WITH RETRY ===');
  console.log('Original URL:', url);

  const urlVariations = Array.from(new Set([
    addCacheBusting(url),
    ...RAW_GITHUB_URLS.map(addCacheBusting),
  ]));

  console.log('🔁 URLs to try:', urlVariations);

  for (const currentUrl of urlVariations) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n🟡 Attempt ${attempt}/${maxRetries} → ${currentUrl}`);

        const response = await fetch(currentUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv,text/plain,*/*',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        // Verifica resposta opaca (possível bloqueio CORS)
        if (response.type === 'opaque') {
          console.warn('⚠️ Opaque response (CORS blocked?)');
          throw new Error('Opaque response received');
        }

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

        console.log(`✅ Successfully fetched CSV from ${currentUrl} with ${lines.length} lines`);
        return csvText;
      } catch (error) {
        console.warn(`❌ Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
    }
  }

  // Todas as tentativas falharam
  const finalError = new Error(
    `Failed to fetch CSV from all attempted URLs.\nTried:\n${urlVariations.join('\n')}`
  );
  console.error('🔥 FINAL ERROR:', finalError);
  throw finalError;
};
