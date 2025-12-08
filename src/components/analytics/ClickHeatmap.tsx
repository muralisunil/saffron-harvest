import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ClickData {
  section: string;
  element: string;
  clicks: number;
}

interface ClickHeatmapProps {
  data: ClickData[];
}

export const ClickHeatmap = ({ data }: ClickHeatmapProps) => {
  const mockData: ClickData[] = [
    { section: "Header", element: "Logo", clicks: 234 },
    { section: "Header", element: "Search Bar", clicks: 456 },
    { section: "Header", element: "Cart Icon", clicks: 189 },
    { section: "Header", element: "Navigation Menu", clicks: 312 },
    { section: "Hero", element: "Shop Now CTA", clicks: 678 },
    { section: "Hero", element: "View Deals", clicks: 423 },
    { section: "Categories", element: "Spices", clicks: 345 },
    { section: "Categories", element: "Rice & Grains", clicks: 289 },
    { section: "Categories", element: "Snacks", clicks: 256 },
    { section: "Categories", element: "Beverages", clicks: 198 },
    { section: "Products", element: "Add to Cart", clicks: 567 },
    { section: "Products", element: "Quick View", clicks: 234 },
    { section: "Products", element: "Product Image", clicks: 445 },
    { section: "Products", element: "Wishlist", clicks: 123 },
    { section: "Footer", element: "Contact Us", clicks: 89 },
    { section: "Footer", element: "Social Links", clicks: 67 },
  ];

  const displayData = data.length > 0 ? data : mockData;
  const maxClicks = Math.max(...displayData.map(d => d.clicks));

  const groupedData = useMemo(() => {
    const groups = new Map<string, ClickData[]>();
    displayData.forEach(item => {
      if (!groups.has(item.section)) {
        groups.set(item.section, []);
      }
      groups.get(item.section)!.push(item);
    });
    return Array.from(groups.entries()).map(([section, items]) => ({
      section,
      items: items.sort((a, b) => b.clicks - a.clicks),
      totalClicks: items.reduce((sum, i) => sum + i.clicks, 0)
    })).sort((a, b) => b.totalClicks - a.totalClicks);
  }, [displayData]);

  const getHeatColor = (intensity: number) => {
    if (intensity < 0.2) return "from-blue-400/20 to-blue-500/30 border-blue-400/50";
    if (intensity < 0.4) return "from-green-400/20 to-green-500/30 border-green-400/50";
    if (intensity < 0.6) return "from-yellow-400/20 to-yellow-500/30 border-yellow-400/50";
    if (intensity < 0.8) return "from-orange-400/20 to-orange-500/30 border-orange-400/50";
    return "from-red-400/20 to-red-500/30 border-red-400/50";
  };

  const getBarWidth = (clicks: number) => {
    return `${Math.max(10, (clicks / maxClicks) * 100)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Click Pattern Heatmap</CardTitle>
        <CardDescription>Most clicked elements by page section</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Visual Page Layout Representation */}
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {/* Mock page layout with click intensity */}
            <div className="p-2 space-y-2">
              {/* Header */}
              <div className={`p-3 rounded bg-gradient-to-r ${getHeatColor(groupedData.find(g => g.section === "Header")?.totalClicks || 0 / (maxClicks * 4))}`}>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="w-16 h-6 bg-primary/30 rounded flex items-center justify-center text-xs">Logo</div>
                    <div className="w-32 h-6 bg-primary/30 rounded flex items-center justify-center text-xs">Search</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-6 bg-primary/30 rounded flex items-center justify-center text-xs">🛒</div>
                    <div className="w-8 h-6 bg-primary/30 rounded flex items-center justify-center text-xs">☰</div>
                  </div>
                </div>
              </div>

              {/* Hero */}
              <div className={`p-6 rounded bg-gradient-to-r ${getHeatColor((groupedData.find(g => g.section === "Hero")?.totalClicks || 0) / (maxClicks * 2))}`}>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs text-muted-foreground">Hero Section</div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-primary/40 rounded text-xs font-medium">Shop Now</div>
                    <div className="px-4 py-2 bg-secondary/40 rounded text-xs font-medium">View Deals</div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className={`p-3 rounded bg-gradient-to-r ${getHeatColor((groupedData.find(g => g.section === "Categories")?.totalClicks || 0) / (maxClicks * 4))}`}>
                <div className="grid grid-cols-4 gap-2">
                  {["Spices", "Rice", "Snacks", "Drinks"].map(cat => (
                    <div key={cat} className="p-2 bg-card/50 rounded text-center text-xs">{cat}</div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className={`p-3 rounded bg-gradient-to-r ${getHeatColor((groupedData.find(g => g.section === "Products")?.totalClicks || 0) / (maxClicks * 4))}`}>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-2 bg-card/50 rounded">
                      <div className="h-8 bg-muted rounded mb-1" />
                      <div className="text-xs text-center">Product {i}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className={`p-2 rounded bg-gradient-to-r ${getHeatColor((groupedData.find(g => g.section === "Footer")?.totalClicks || 0) / (maxClicks * 2))}`}>
                <div className="text-center text-xs text-muted-foreground">Footer</div>
              </div>
            </div>
          </div>

          {/* Detailed Click Stats */}
          <div className="space-y-4">
            {groupedData.map(group => (
              <div key={group.section} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{group.section}</h4>
                  <span className="text-xs text-muted-foreground">{group.totalClicks.toLocaleString()} clicks</span>
                </div>
                <div className="space-y-1">
                  {group.items.slice(0, 3).map(item => (
                    <div key={item.element} className="flex items-center gap-2">
                      <div className="w-24 text-xs text-muted-foreground truncate">{item.element}</div>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getHeatColor(item.clicks / maxClicks)} transition-all`}
                          style={{ width: getBarWidth(item.clicks) }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right font-medium">{item.clicks}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Top clicked elements */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Top Clicked Elements</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {displayData.sort((a, b) => b.clicks - a.clicks).slice(0, 6).map((item, i) => (
                <div 
                  key={item.element} 
                  className={`p-3 rounded-lg border bg-gradient-to-br ${getHeatColor(item.clicks / maxClicks)}`}
                >
                  <div className="text-lg font-bold">#{i + 1}</div>
                  <div className="text-sm font-medium">{item.element}</div>
                  <div className="text-xs text-muted-foreground">{item.clicks} clicks</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
