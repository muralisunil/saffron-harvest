import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, X, Filter, Clock, Trash2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { products, categories } from "@/data/products";
import { Product } from "@/types/product";
import { Link, useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "desi-pantry-recent-searches";
const MAX_RECENT_SEARCHES = 5;

interface RecentSearch {
  id: string;
  name: string;
  query: string;
  timestamp: number;
}

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load recent searches:", e);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((product: Product) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.id !== product.id);
      const newSearch: RecentSearch = {
        id: product.id,
        name: product.name,
        query: query,
        timestamp: Date.now(),
      };
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [query]);

  const removeRecentSearch = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  useEffect(() => {
    if (query.length < 2 && selectedCategories.length === 0) {
      setResults([]);
      return;
    }

    const filtered = products.filter((product) => {
      const matchesQuery =
        query.length < 2 ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.dietaryTags?.some((tag) =>
          tag.toLowerCase().includes(query.toLowerCase())
        );

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const matchesStock =
        !inStockOnly ||
        product.variants.some((v) => v.stock > 0);

      return matchesQuery && matchesCategory && matchesStock;
    });

    setResults(filtered.slice(0, 8));
    setSelectedIndex(-1);
  }, [query, selectedCategories, inStockOnly]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll("[data-result-item]");
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleSelectProduct = useCallback(
    (product: Product) => {
      saveRecentSearch(product);
      navigate(`/product/${product.id}`);
      setIsOpen(false);
      setQuery("");
      setSelectedIndex(-1);
    },
    [saveRecentSearch, navigate]
  );

  // Trending searches - based on bestsellers and popular products
  const trendingProducts = useMemo(() => {
    return products
      .filter((p) => p.isBestSeller || p.discount)
      .slice(0, 5);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const hasResults = query.length >= 2;
      const recentCount = recentSearches.length;
      const trendingCount = trendingProducts.length;
      
      let itemsCount: number;
      if (hasResults) {
        itemsCount = results.length;
      } else {
        itemsCount = recentCount + trendingCount;
      }

      if (!isOpen || itemsCount === 0) {
        if (e.key === "Escape") {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < itemsCount - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : itemsCount - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (hasResults && selectedIndex < results.length) {
              handleSelectProduct(results[selectedIndex]);
            } else if (!hasResults) {
              // Handle combined recent + trending navigation
              if (selectedIndex < recentCount) {
                const recent = recentSearches[selectedIndex];
                const product = products.find((p) => p.id === recent.id);
                if (product) handleSelectProduct(product);
              } else {
                const trendingIndex = selectedIndex - recentCount;
                if (trendingIndex < trendingCount) {
                  handleSelectProduct(trendingProducts[trendingIndex]);
                }
              }
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex, query, recentSearches, trendingProducts, handleSelectProduct]
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setInStockOnly(false);
    setQuery("");
  };

  const activeFiltersCount =
    selectedCategories.length + (inStockOnly ? 1 : 0);

  const showTrending = query.length < 2 && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-8 bg-background/80 backdrop-blur-sm border-border/50 focus:border-primary/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative bg-background/80 backdrop-blur-sm border-border/50"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-popover border shadow-lg" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Filters</h4>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories
                    .filter((c) => c !== "All")
                    .map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <span className="truncate">{category}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Availability
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={inStockOnly}
                    onCheckedChange={(checked) =>
                      setInStockOnly(checked as boolean)
                    }
                  />
                  <span>In stock only</span>
                </label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Dropdown */}
      {isOpen && (showTrending || query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Recent Searches + Trending when no query */}
          {showTrending && (
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Recent Searches
                    </span>
                    <button
                      onClick={clearAllRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  {recentSearches.map((recent, index) => {
                    const product = products.find((p) => p.id === recent.id);
                    if (!product) return null;
                    return (
                      <Link
                        key={recent.id}
                        to={`/product/${recent.id}`}
                        data-result-item
                        onClick={() => {
                          saveRecentSearch(product);
                          setIsOpen(false);
                          setQuery("");
                          setSelectedIndex(-1);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "flex items-center gap-3 p-3 transition-colors border-b last:border-b-0 group",
                          selectedIndex === index
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand}
                          </p>
                        </div>
                        <button
                          onClick={(e) => removeRecentSearch(recent.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Trending Searches Section */}
              {trendingProducts.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b bg-muted/30">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Trending Searches
                    </span>
                  </div>
                  {trendingProducts.map((product, index) => {
                    const navIndex = recentSearches.length + index;
                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        data-result-item
                        onClick={() => handleSelectProduct(product)}
                        onMouseEnter={() => setSelectedIndex(navIndex)}
                        className={cn(
                          "flex items-center gap-3 p-3 transition-colors border-b last:border-b-0",
                          selectedIndex === navIndex
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.brand}
                          </p>
                        </div>
                        {product.isBestSeller && (
                          <Badge variant="secondary" className="text-[10px]">
                            Popular
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Search Results */}
          {!showTrending && results.length > 0 && (
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
              {selectedCategories.length > 0 && (
                <div className="px-3 py-2 border-b bg-muted/30">
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => toggleCategory(cat)}
                      >
                        {cat} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {results.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  data-result-item
                  onClick={() => handleSelectProduct(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors border-b last:border-b-0",
                    selectedIndex === index
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand} • {product.category}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      ₹{product.variants[0]?.price}
                    </p>
                  </div>
                  {product.isBestSeller && (
                    <Badge variant="secondary" className="text-[10px]">
                      Bestseller
                    </Badge>
                  )}
                </Link>
              ))}
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-center text-sm text-primary hover:bg-accent/30 transition-colors"
              >
                View all products →
              </Link>
            </div>
          )}

          {/* No Results */}
          {!showTrending && query.length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No products found for "{query}"</p>
              <Link
                to="/products"
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Browse all products
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
