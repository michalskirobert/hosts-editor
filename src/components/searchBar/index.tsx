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
      <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.15)] dark:focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.2)]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        <input
          type="search"
          placeholder={placeholder}
          onChange={onSearchChange}
          className="w-full bg-transparent py-3 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
};
