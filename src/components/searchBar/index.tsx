import React, { type ChangeEvent } from "react";
import { Input } from "@material-tailwind/react";
import { Search } from "iconoir-react";

interface SearchBarProps {
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  placeholder = "Search...",
}) => {
  return (
    <Input
      crossOrigin={undefined}
      label="Search"
      icon={<Search />}
      placeholder={placeholder}
      onChange={onSearchChange}
      type="search"
    />
  );
};
