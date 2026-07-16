"use client";
import FormattedDateTime from "./FormattedDateTime";
import { Input } from "./ui/input";
import { getFileAccessUrl, getFiles } from "@/lib/actions/file.actions";
import { useToast } from "@/hooks/use-toast";
import { isLikelyFilenameQuery } from "@/lib/utils";
import { Mic, Search as SearchIcon, Sparkles, Square } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Thumbnail from "./Thumbnail";
import { useDebounce } from "use-debounce";

interface SemanticResult {
  id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  created_at: string;
  storage_key: string;
  similarity: number;
}

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const [results, setResults] = useState<FileItem[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const minQueryLength = 2;
  const { toast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setQuery(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        toast({
          variant: "destructive",
          title: "Voice input not supported",
          description: "Your browser does not support voice input.",
        });
        return;
      }
      try {
        setQuery(""); // Clear query when starting new voice input
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition", e);
      }
    }
  };

  const router = useRouter();
  const path = usePathname();

  const [debouncedQuery] = useDebounce(query.trim(), 400);

  const fetchSemanticResults = useCallback(
    async (q: string, signal?: AbortSignal): Promise<SemanticResult[]> => {
      try {
        // Get workspaceId from cookie — we'll read it from the current page context
        // Since we can't read httpOnly cookies client-side, we pass workspaceId via API
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
          signal,
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
      } catch {
        return [];
      }
    },
    [],
  );

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setSemanticResults([]);
        setOpen(false);

        // If the current URL has a search param, clear it when the user clears the input.
        if (searchParams.get("query")) {
          router.replace(path);
        }

        return;
      }

      if (debouncedQuery.length < minQueryLength) {
        setResults([]);
        setSemanticResults([]);
        setOpen(false);
        return;
      }

      // Run keyword search always
      const keywordPromise = getFiles({
        types: [],
        searchText: debouncedQuery,
        limit: 8,
      });

      // Skip embeddings for literal filename lookups; keyword search still runs.
      const shouldRunSemantic = !isLikelyFilenameQuery(debouncedQuery);
      const semanticPromise = shouldRunSemantic
        ? fetchSemanticResults(debouncedQuery, controller.signal)
        : Promise.resolve([]);

      let files = { documents: [] as FileItem[] };
      let semantic = [] as SemanticResult[];

      try {
        const [filesResult, semanticResult] = await Promise.all([
          keywordPromise,
          semanticPromise,
        ]);
        if (filesResult) {
          files =
            typeof filesResult === "string"
              ? JSON.parse(filesResult)
              : filesResult;
        }
        if (semanticResult) {
          semantic =
            typeof semanticResult === "string"
              ? JSON.parse(semanticResult)
              : semanticResult;
        }
      } catch (error) {
        console.error("Search failed:", error);
      }

      if (!isActive) return;

      setResults(files.documents || []);
      setSemanticResults(semantic || []);
      setOpen(true);
    };

    fetchFiles();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debouncedQuery, path, router, searchParams, fetchSemanticResults]);

  const handleClickItem = (file: FileItem) => {
    setOpen(false);
    setResults([]);
    setSemanticResults([]);

    router.push(
      `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${query}`,
    );
  };

  const handleClickSemantic = async (result: SemanticResult) => {
    setOpen(false);
    setResults([]);
    setSemanticResults([]);

    // Open a blank tab synchronously to avoid browser popup blockers
    const newTab = window.open("about:blank", "_blank");

    try {
      const url = await getFileAccessUrl(result.id);
      if (url && newTab) {
        newTab.location.href = url;
        return;
      }
    } catch (error) {
      console.error("Failed to open semantic search result:", error);
    }

    if (newTab) {
      newTab.close();
    }

    toast({
      variant: "destructive",
      title: "Unable to open file",
      description:
        "This file is no longer available or you no longer have access.",
    });
  };

  const hasSemanticResults = semanticResults.length > 0;
  const hasKeywordResults = results.length > 0;
  const hasAnyResults = hasSemanticResults || hasKeywordResults;

  return (
    <div className="search" ref={searchRef}>
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
          aria-label={isListening ? "Stop voice input" : "Use voice input"}
          onClick={toggleListening}
          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 ${
            isListening
              ? "border-brand bg-red-50 text-brand shadow-[0_0_15px_rgba(250,114,117,0.7)] animate-pulse"
              : "border-white/80 bg-white/90 text-slate-500 hover:text-brand"
          }`}
        >
          {isListening ? (
            <Square className="size-4 fill-current cursor-pointer" />
          ) : (
            <Mic className="size-4 cursor-pointer" />
          )}
        </button>

        {open && (
          <ul className="search-result">
            {hasAnyResults ? (
              <>
                {/* Semantic / AI results section */}
                {hasSemanticResults && (
                  <>
                    <li className="px-3 pt-2 pb-1">
                      <p className="text-[10px] uppercase tracking-wider text-brand font-semibold flex items-center gap-1">
                        <Sparkles className="size-3" />
                        Ask AI
                      </p>
                    </li>
                    {semanticResults.slice(0, 3).map((result) => (
                      <li
                        key={`semantic-${result.id}`}
                        className="rounded-xl transition-colors hover:bg-slate-100/80"
                      >
                        <button
                          type="button"
                          onClick={() => handleClickSemantic(result)}
                          className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35 cursor-pointer"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Sparkles className="size-4 shrink-0 text-brand/60 cursor-pointer" />
                            <p className="line-clamp-1 text-sm font-medium text-slate-700">
                              {result.name}
                            </p>
                          </div>
                          <span className="text-[10px] text-light-200 shrink-0">
                            {Math.round(result.similarity * 100)}% match
                          </span>
                        </button>
                      </li>
                    ))}
                  </>
                )}

                {/* Keyword results section */}
                {hasKeywordResults && (
                  <>
                    {hasSemanticResults && (
                      <li className="px-3 pt-2 pb-1">
                        <p className="text-[10px] uppercase tracking-wider text-light-200 font-semibold">
                          Files
                        </p>
                      </li>
                    )}
                    {results.map((file) => (
                      <li
                        key={file.id}
                        className="rounded-xl transition-colors hover:bg-slate-100/80"
                      >
                        <button
                          type="button"
                          onClick={() => handleClickItem(file)}
                          className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b6b]/35 cursor-pointer"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Thumbnail
                              type={file.type}
                              extension={file.extension}
                              url={file.url}
                              thumbnailUrl={file.thumbnailUrl}
                              className="size-9 min-w-9 cursor-pointer"
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
                    ))}
                  </>
                )}
              </>
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
