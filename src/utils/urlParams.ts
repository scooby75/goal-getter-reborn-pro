// src/utils/urlParams.ts
export const saveFiltersToUrl = (params: {
  homeTeam?: string;
  awayTeam?: string;
  printTeam?: string;
  model?: string;
}) => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  
  if (params.homeTeam) {
    url.searchParams.set('home', encodeURIComponent(params.homeTeam));
  } else {
    url.searchParams.delete('home');
  }
  
  if (params.awayTeam) {
    url.searchParams.set('away', encodeURIComponent(params.awayTeam));
  } else {
    url.searchParams.delete('away');
  }
  
  if (params.printTeam) {
    url.searchParams.set('print', encodeURIComponent(params.printTeam));
  } else {
    url.searchParams.delete('print');
  }
  
  if (params.model) {
    url.searchParams.set('model', params.model);
  } else {
    url.searchParams.delete('model');
  }

  window.history.pushState({}, '', url.toString());
};

export const getFiltersFromUrl = () => {
  if (typeof window === 'undefined') return {};

  const url = new URL(window.location.href);
  return {
    homeTeam: url.searchParams.get('home') ? decodeURIComponent(url.searchParams.get('home')!) : '',
    awayTeam: url.searchParams.get('away') ? decodeURIComponent(url.searchParams.get('away')!) : '',
    printTeam: url.searchParams.get('print') ? decodeURIComponent(url.searchParams.get('print')!) : '',
    model: url.searchParams.get('model') || 'dixon-coles'
  };
};