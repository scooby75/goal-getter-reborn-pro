
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ImprovedTeamSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
}

export const ImprovedTeamSearch: React.FC<ImprovedTeamSearchProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  label
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options.slice(0, 50); // Limit initial results
    
    const searchLower = searchValue.toLowerCase();
    return options
      .filter(option => 
        option.toLowerCase().includes(searchLower)
      )
      .slice(0, 20); // Limit search results
  }, [options, searchValue]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchValue('');
  };

  const handleClear = () => {
    onValueChange('');
    setSearchValue('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-left font-normal"
            >
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {value || placeholder}
              </span>
              <div className="flex items-center">
                {value && (
                  <X 
                    className="h-4 w-4 mr-2 cursor-pointer hover:text-destructive" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                )}
                <Search className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`} 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No teams found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
