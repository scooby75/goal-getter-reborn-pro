
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
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
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

  const filteredOptions = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    
    if (!normalizedSearch) {
      return [...options].sort((a, b) => a.localeCompare(b));
    }

    return options
      .filter(option => normalizeText(option).includes(normalizedSearch))
      .sort((a, b) => a.localeCompare(b));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: string) => {
    onValueChange(option);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={className} ref={containerRef}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} ({options.length} times disponíveis)
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            setSearchTerm('');
          }}
          className="w-full flex items-center justify-between px-2 py-1.5 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <span className={value ? "text-gray-900" : "text-gray-500"}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
            <div className="p-1.5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!open) setOpen(true);
                }}
                placeholder="Digite para buscar..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="divide-y divide-gray-200">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-gray-500 text-center text-xs">
                  Nenhum time encontrado para "{searchTerm}"
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full flex items-center px-2 py-1.5 text-left hover:bg-gray-50 focus:outline-none text-xs",
                      value === option ? "bg-blue-50 text-blue-600" : "text-gray-900"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-1.5 h-3 w-3 flex-shrink-0",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option}</span>
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
