import React, { type ChangeEvent } from "react";
import { Search } from "iconoir-react";

interface SearchBarProps {
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  placeholder = "Search",
}) => {
  return (
    <div className="w-full">
      <div className="relative rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.15)]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder={placeholder}
          onChange={onSearchChange}
          className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};
