import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  className?: string;
}

const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Remove múltiplos espaços
    .toLowerCase();
};

export const SearchableSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  className
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and sort options based on search term
  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    if (!normalizedSearch) {
      return [...options].sort((a, b) => a.localeCompare(b));
    }
    
    return options
      .map(option => ({
        original: option,
        normalized: normalizeText(option),
        searchScore: 0
      }))
      .filter(({ normalized }) => {
        // Verifica se o termo de busca está contido na opção
        if (normalized.includes(normalizedSearch)) {
          return true;
        }
        
        // Verifica se partes do termo estão presentes (para buscas mais flexíveis)
        const searchParts = normalizedSearch.split(' ');
        return searchParts.some(part => normalized.includes(part));
      })
      .sort((a, b) => {
        // Pontuação baseada na posição e qualidade do match
        const aStartsWith = a.normalized.startsWith(normalizedSearch) ? 3 : 0;
        const bStartsWith = b.normalized.startsWith(normalizedSearch) ? 3 : 0;
        
        const aWordStartsWith = a.normalized.includes(` ${normalizedSearch}`) ? 2 : 0;
        const bWordStartsWith = b.normalized.includes(` ${normalizedSearch}`) ? 2 : 0;
        
        const aContains = a.normalized.includes(normalizedSearch) ? 1 : 0;
        const bContains = b.normalized.includes(normalizedSearch) ? 1 : 0;
        
        const aScore = aStartsWith + aWordStartsWith + aContains;
        const bScore = bStartsWith + bWordStartsWith + bContains;
        
        if (aScore !== bScore) return bScore - aScore;
        
        // Se a pontuação for igual, ordena alfabeticamente
        return a.original.localeCompare(b.original);
      })
      .map(({ original }) => original);
  }, [options, searchTerm]);

  // Restante do componente permanece igual...
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionSelect = (option: string) => {
    onValueChange(option === value ? "" : option);
    setOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!open) setOpen(true);
  };

  const handleButtonClick = () => {
    setOpen(!open);
    setSearchTerm('');
  };

  return (
    <div className={className} ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} ({options.length} times disponíveis)
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="Digite para buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 && searchTerm ? (
                <div className="px-3 py-2 text-gray-500 text-center">
                  Nenhum time encontrado.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100",
                      value === option ? "bg-blue-50 text-blue-600" : "text-gray-900"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
