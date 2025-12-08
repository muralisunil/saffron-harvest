import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ScrollDepthData {
  pagePath: string;
  depth: number;
  count: number;
}

interface ScrollDepthHeatmapProps {
  data: ScrollDepthData[];
}

export const ScrollDepthHeatmap = ({ data }: ScrollDepthHeatmapProps) => {
  const processedData = useMemo(() => {
    // Group by page path
    const pageMap = new Map<string, Map<number, number>>();
    
    data.forEach(item => {
      if (!pageMap.has(item.pagePath)) {
        pageMap.set(item.pagePath, new Map());
      }
      const depthMap = pageMap.get(item.pagePath)!;
      depthMap.set(item.depth, (depthMap.get(item.depth) || 0) + item.count);
    });

    return Array.from(pageMap.entries()).map(([path, depthMap]) => ({
      path,
      depths: Array.from(depthMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([depth, count]) => ({ depth, count }))
    }));
  }, [data]);

  // Create depth buckets (0-10%, 10-20%, etc.)
  const depthBuckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const getHeatColor = (intensity: number) => {
    // Gradient from cool to hot
    if (intensity === 0) return "bg-muted";
    if (intensity < 0.2) return "bg-blue-200 dark:bg-blue-900";
    if (intensity < 0.4) return "bg-green-300 dark:bg-green-800";
    if (intensity < 0.6) return "bg-yellow-300 dark:bg-yellow-700";
    if (intensity < 0.8) return "bg-orange-400 dark:bg-orange-600";
    return "bg-red-500 dark:bg-red-600";
  };

  const mockData = [
    { path: "/", depths: [
      { depth: 0, count: 100 },
      { depth: 10, count: 95 },
      { depth: 20, count: 88 },
      { depth: 30, count: 75 },
      { depth: 40, count: 62 },
      { depth: 50, count: 48 },
      { depth: 60, count: 35 },
      { depth: 70, count: 25 },
      { depth: 80, count: 18 },
      { depth: 90, count: 12 },
      { depth: 100, count: 8 },
    ]},
    { path: "/products", depths: [
      { depth: 0, count: 80 },
      { depth: 10, count: 78 },
      { depth: 20, count: 72 },
      { depth: 30, count: 65 },
      { depth: 40, count: 55 },
      { depth: 50, count: 45 },
      { depth: 60, count: 38 },
      { depth: 70, count: 30 },
      { depth: 80, count: 22 },
      { depth: 90, count: 15 },
      { depth: 100, count: 10 },
    ]},
    { path: "/cart", depths: [
      { depth: 0, count: 50 },
      { depth: 10, count: 48 },
      { depth: 20, count: 46 },
      { depth: 30, count: 44 },
      { depth: 40, count: 42 },
      { depth: 50, count: 40 },
      { depth: 60, count: 38 },
      { depth: 70, count: 35 },
      { depth: 80, count: 32 },
      { depth: 90, count: 28 },
      { depth: 100, count: 25 },
    ]},
  ];

  const displayData = processedData.length > 0 ? processedData : mockData;
  const maxCount = Math.max(...displayData.flatMap(p => p.depths.map(d => d.count)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scroll Depth Heatmap</CardTitle>
        <CardDescription>How far users scroll on each page</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />
              <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-800" />
              <div className="w-4 h-4 rounded bg-yellow-300 dark:bg-yellow-700" />
              <div className="w-4 h-4 rounded bg-orange-400 dark:bg-orange-600" />
              <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-600" />
            </div>
            <span className="text-muted-foreground">More</span>
          </div>

          {/* Heatmap Grid */}
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center gap-2">
              <div className="w-24 text-xs font-medium text-muted-foreground">Page</div>
              <div className="flex-1 grid grid-cols-11 gap-1">
                {depthBuckets.map(bucket => (
                  <div key={bucket} className="text-center text-xs text-muted-foreground">
                    {bucket}%
                  </div>
                ))}
              </div>
            </div>

            {/* Data rows */}
            {displayData.map(page => (
              <div key={page.path} className="flex items-center gap-2">
                <div className="w-24 text-xs font-medium truncate" title={page.path}>
                  {page.path}
                </div>
                <div className="flex-1 grid grid-cols-11 gap-1">
                  {depthBuckets.map(bucket => {
                    const depthData = page.depths.find(d => d.depth === bucket);
                    const count = depthData?.count || 0;
                    const intensity = maxCount > 0 ? count / maxCount : 0;
                    
                    return (
                      <div
                        key={bucket}
                        className={`h-8 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-default ${getHeatColor(intensity)}`}
                        title={`${page.path} at ${bucket}%: ${count} users`}
                      >
                        {count > 0 && count}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(displayData.reduce((sum, p) => {
                  const depths = p.depths.filter(d => d.depth >= 50);
                  const total = p.depths.reduce((s, d) => s + d.count, 0);
                  const deep = depths.reduce((s, d) => s + d.count, 0);
                  return sum + (total > 0 ? (deep / total) * 100 : 0);
                }, 0) / displayData.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg. 50%+ Scroll</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Math.round(displayData.reduce((sum, p) => {
                  const depths = p.depths.filter(d => d.depth >= 100);
                  const total = p.depths.reduce((s, d) => s + d.count, 0);
                  const complete = depths.reduce((s, d) => s + d.count, 0);
                  return sum + (total > 0 ? (complete / total) * 100 : 0);
                }, 0) / displayData.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Complete Scrolls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {displayData.length}
              </div>
              <div className="text-xs text-muted-foreground">Pages Tracked</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
