"use client";
import FormattedDateTime from "./FormattedDateTime";
import { Input } from "./ui/input";
import { getFiles } from "@/lib/actions/file.actions";
import { Mic, Search as SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Thumbnail from "./Thumbnail";
import { useDebounce } from "use-debounce";

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const [results, setResults] = useState<FileItem[]>([]);
  const [open, setOpen] = useState(false);
  const minQueryLength = 2;

  const router = useRouter();
  const path = usePathname();

  const [debouncedQuery] = useDebounce(query.trim(), 400);

  useEffect(() => {
    let isActive = true;

    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setOpen(false);

        // If the current URL has a search param, clear it when the user clears the input.
        if (searchParams.get("query")) {
          router.replace(path);
        }

        return;
      }

      if (debouncedQuery.length < minQueryLength) {
        setResults([]);
        setOpen(false);
        return;
      }

      const files = await getFiles({
        types: [],
        searchText: debouncedQuery,
        limit: 8,
      });

      if (!isActive) return;

      setResults(files.documents);
      setOpen(true);
    };

    fetchFiles();

    return () => {
      isActive = false;
    };
  }, [debouncedQuery, path, router, searchParams]);

  const handleClickItem = (file: FileItem) => {
    setOpen(false);
    setResults([]);

    router.push(
      `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${query}`
    );
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <SearchIcon className="size-5 text-slate-400 transition-colors focus-within:text-[#ff6b6b]" />

        <Input
          value={query}
          placeholder="Ask AI anything..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          aria-label="Use voice input"
          className="inline-flex size-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-500 transition-colors hover:text-[#ff6b6b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35"
        >
          <Mic className="size-4" />
        </button>

        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) => (
                <li
                  key={file.id}
                  className="rounded-xl transition-colors hover:bg-slate-100/80"
                >
                  <button
                    type="button"
                    onClick={() => handleClickItem(file)}
                    className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Thumbnail
                        type={file.type}
                        extension={file.extension}
                        url={file.url}
                        thumbnailUrl={file.thumbnailUrl}
                        className="size-9 min-w-9"
                      />
                      <p className="line-clamp-1 text-sm font-medium text-slate-700">
                        {file.name}
                      </p>
                    </div>

                    <FormattedDateTime
                      date={file.createdAt}
                      className="caption line-clamp-1 text-light-200"
                    />
                  </button>
                </li>
              ))
            ) : (
              <p className="empty-result">
                No files found for <span className="font-bold">{query}</span>
              </p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
