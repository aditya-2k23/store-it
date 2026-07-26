"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";

const Sort = () => {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || sortTypes[0].value;

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${path}?${params.toString()}`);
  };

  return (
    <Select onValueChange={handleSort} value={currentSort}>
      <SelectTrigger className="sort-select">
        <SelectValue placeholder={sortTypes[0].value} />
      </SelectTrigger>
      <SelectContent className="sort-select-content">
        {sortTypes.map((sort) => (
          <SelectItem
            key={sort.label}
            className="shad-select-item"
            value={sort.value}
          >
            {sort.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Sort;
