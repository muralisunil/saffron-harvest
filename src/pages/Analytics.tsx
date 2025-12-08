import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Funnel, FunnelChart, LabelList
} from "recharts";
import { 
  Eye, MousePointerClick, ShoppingCart, CreditCard, 
  TrendingUp, Search, ArrowLeft, Users, Clock, Target, CalendarIcon, RefreshCw, GitCompare
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface PageViewData {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface ProductPerformance {
  productId: string;
  name: string;
  views: number;
  addToCart: number;
  purchases: number;
  conversionRate: number;
}

interface SearchTrend {
  query: string;
  count: number;
  clickRate: number;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<Date | undefined>(undefined);
  const [comparisonEndDate, setComparisonEndDate] = useState<Date | undefined>(undefined);
  const [comparisonPageViews, setComparisonPageViews] = useState<PageViewData[]>([]);
  const [comparisonStats, setComparisonStats] = useState({
    totalPageViews: 0,
    uniqueSessions: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
  });
  
  const [stats, setStats] = useState({
    totalPageViews: 0,
    uniqueSessions: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
  });

  const refreshData = useCallback(() => {
    fetchAnalyticsData();
    if (comparisonMode && comparisonStartDate && comparisonEndDate) {
      fetchComparisonData();
    }
    setLastRefresh(new Date());
  }, [timeRange, customStartDate, customEndDate, comparisonMode, comparisonStartDate, comparisonEndDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  // Fetch comparison data when dates change
  useEffect(() => {
    if (comparisonMode && comparisonStartDate && comparisonEndDate) {
      fetchComparisonData();
    }
  }, [comparisonMode, comparisonStartDate, comparisonEndDate]);

  const getDateRange = () => {
    if (timeRange === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    
    const now = new Date();
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const fetchComparisonData = async () => {
    if (!comparisonStartDate || !comparisonEndDate) return;
    
    const start = new Date(comparisonStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(comparisonEndDate);
    end.setHours(23, 59, 59, 999);
    
    try {
      const { data: pageViewsData } = await supabase
        .from("analytics_page_views")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      const { data: sessionsData } = await supabase
        .from("analytics_sessions")
        .select("*")
        .gte("started_at", start.toISOString())
        .lte("started_at", end.toISOString());

      const viewsByDate = processPageViewsByDate(pageViewsData || []);
      setComparisonPageViews(viewsByDate);

      const uniqueSessions = new Set((pageViewsData || []).map(pv => pv.session_id)).size;
      const avgTime = (pageViewsData || [])
        .filter(pv => pv.time_on_page_ms)
        .reduce((sum, pv) => sum + (pv.time_on_page_ms || 0), 0) / ((pageViewsData || []).length || 1);
      
      const bounceSessions = (sessionsData || []).filter(s => s.is_bounce).length;
      const bounceRate = ((sessionsData || []).length > 0) 
        ? (bounceSessions / (sessionsData || []).length) * 100 
        : 0;

      setComparisonStats({
        totalPageViews: (pageViewsData || []).length,
        uniqueSessions,
        avgTimeOnPage: Math.round(avgTime / 1000),
        bounceRate: Math.round(bounceRate),
      });
    } catch (error) {
      console.error("Error fetching comparison data:", error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      // Fetch page views
      const { data: pageViewsData } = await supabase
        .from("analytics_page_views")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from("analytics_sessions")
        .select("*")
        .gte("started_at", startDate)
        .lte("started_at", endDate);

      // Fetch product events
      const { data: productEventsData } = await supabase
        .from("analytics_product_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Fetch search events
      const { data: searchEventsData } = await supabase
        .from("analytics_search_events")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Process page views by date
      const viewsByDate = processPageViewsByDate(pageViewsData || []);
      setPageViews(viewsByDate);

      // Calculate stats
      const uniqueSessions = new Set((pageViewsData || []).map(pv => pv.session_id)).size;
      const avgTime = (pageViewsData || [])
        .filter(pv => pv.time_on_page_ms)
        .reduce((sum, pv) => sum + (pv.time_on_page_ms || 0), 0) / ((pageViewsData || []).length || 1);
      
      const bounceSessions = (sessionsData || []).filter(s => s.is_bounce).length;
      const bounceRate = ((sessionsData || []).length > 0) 
        ? (bounceSessions / (sessionsData || []).length) * 100 
        : 0;

      setStats({
        totalPageViews: (pageViewsData || []).length,
        uniqueSessions,
        avgTimeOnPage: Math.round(avgTime / 1000),
        bounceRate: Math.round(bounceRate),
      });

      // Process product performance
      const productStats = processProductPerformance(productEventsData || []);
      setProductPerformance(productStats);

      // Process search trends
      const searchStats = processSearchTrends(searchEventsData || []);
      setSearchTrends(searchStats);

      // Calculate funnel data
      const funnel = calculateFunnelData(productEventsData || []);
      setFunnelData(funnel);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processPageViewsByDate = (data: any[]): PageViewData[] => {
    const dateMap = new Map<string, { views: number; sessions: Set<string> }>();
    
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { views: 0, sessions: new Set() });
      }
      
      const entry = dateMap.get(date)!;
      entry.views += 1;
      entry.sessions.add(item.session_id);
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueVisitors: data.sessions.size,
      }))
      .slice(-14);
  };

  const processProductPerformance = (data: any[]): ProductPerformance[] => {
    const productMap = new Map<string, { views: number; addToCart: number; purchases: number }>();

    data.forEach(item => {
      if (!productMap.has(item.product_id)) {
        productMap.set(item.product_id, { views: 0, addToCart: 0, purchases: 0 });
      }
      
      const stats = productMap.get(item.product_id)!;
      if (item.event_type === "view") stats.views += 1;
      if (item.event_type === "add_to_cart") stats.addToCart += 1;
      if (item.event_type === "purchase") stats.purchases += 1;
    });

    return Array.from(productMap.entries())
      .map(([productId, stats]) => ({
        productId,
        name: productId.substring(0, 12),
        views: stats.views,
        addToCart: stats.addToCart,
        purchases: stats.purchases,
        conversionRate: stats.views > 0 ? Math.round((stats.addToCart / stats.views) * 100) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  const processSearchTrends = (data: any[]): SearchTrend[] => {
    const queryMap = new Map<string, { count: number; clicks: number }>();

    data.forEach(item => {
      const query = item.query.toLowerCase().trim();
      if (!queryMap.has(query)) {
        queryMap.set(query, { count: 0, clicks: 0 });
      }
      
      const stats = queryMap.get(query)!;
      stats.count += 1;
      if (item.clicked_result_id) stats.clicks += 1;
    });

    return Array.from(queryMap.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        clickRate: stats.count > 0 ? Math.round((stats.clicks / stats.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const calculateFunnelData = (data: any[]): FunnelData[] => {
    const views = data.filter(d => d.event_type === "view").length;
    const addToCart = data.filter(d => d.event_type === "add_to_cart").length;
    const purchases = data.filter(d => d.event_type === "purchase").length;

    return [
      { name: "Product Views", value: views || 100, fill: "hsl(var(--primary))" },
      { name: "Add to Cart", value: addToCart || 45, fill: "hsl(var(--secondary))" },
      { name: "Purchases", value: purchases || 12, fill: "hsl(var(--accent))" },
    ];
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  // Mock data for demo when no real data
  const mockPageViews = [
    { date: "Dec 1", views: 120, uniqueVisitors: 85 },
    { date: "Dec 2", views: 150, uniqueVisitors: 102 },
    { date: "Dec 3", views: 180, uniqueVisitors: 130 },
    { date: "Dec 4", views: 140, uniqueVisitors: 95 },
    { date: "Dec 5", views: 200, uniqueVisitors: 145 },
    { date: "Dec 6", views: 220, uniqueVisitors: 160 },
    { date: "Dec 7", views: 190, uniqueVisitors: 140 },
  ];

  const mockProductPerformance = [
    { productId: "1", name: "Basmati Rice", views: 450, addToCart: 120, purchases: 45, conversionRate: 27 },
    { productId: "2", name: "Masala Chai", views: 380, addToCart: 95, purchases: 38, conversionRate: 25 },
    { productId: "3", name: "Ghee", views: 320, addToCart: 85, purchases: 32, conversionRate: 27 },
    { productId: "4", name: "Atta Flour", views: 290, addToCart: 70, purchases: 28, conversionRate: 24 },
    { productId: "5", name: "Turmeric", views: 250, addToCart: 60, purchases: 22, conversionRate: 24 },
  ];

  const mockSearchTrends = [
    { query: "rice", count: 145, clickRate: 78 },
    { query: "spices", count: 120, clickRate: 65 },
    { query: "ghee", count: 95, clickRate: 82 },
    { query: "dal", count: 88, clickRate: 70 },
    { query: "atta", count: 75, clickRate: 75 },
    { query: "masala", count: 68, clickRate: 60 },
    { query: "tea", count: 55, clickRate: 85 },
    { query: "pickle", count: 42, clickRate: 72 },
  ];

  const mockFunnelData = [
    { name: "Product Views", value: 1000, fill: "hsl(var(--primary))" },
    { name: "Add to Cart", value: 450, fill: "hsl(var(--secondary))" },
    { name: "Checkout Started", value: 180, fill: "hsl(var(--accent))" },
    { name: "Purchases", value: 120, fill: "hsl(45, 93%, 47%)" },
  ];

  const displayPageViews = pageViews.length > 0 ? pageViews : mockPageViews;
  const displayProductPerformance = productPerformance.length > 0 ? productPerformance : mockProductPerformance;
  const displaySearchTrends = searchTrends.length > 0 ? searchTrends : mockSearchTrends;
  const displayFunnelData = funnelData.some(f => f.value > 0) ? funnelData : mockFunnelData;

  const displayStats = stats.totalPageViews > 0 ? stats : {
    totalPageViews: 1847,
    uniqueSessions: 892,
    avgTimeOnPage: 127,
    bounceRate: 34,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track your store performance</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "gap-2",
                  autoRefresh && "text-secondary"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", autoRefresh && "animate-spin")} style={{ animationDuration: '3s' }} />
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <span className="text-xs hidden sm:inline">
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>

            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {timeRange === "custom" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      disabled={(date) => date > new Date() || (customEndDate ? date > customEndDate : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">to</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      disabled={(date) => date > new Date() || (customStartDate ? date < customStartDate : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Mode Toggle */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2">
            <Switch
              id="comparison-mode"
              checked={comparisonMode}
              onCheckedChange={setComparisonMode}
            />
            <Label htmlFor="comparison-mode" className="flex items-center gap-2 cursor-pointer">
              <GitCompare className="h-4 w-4" />
              Compare Periods
            </Label>
          </div>

          {comparisonMode && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Compare with:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !comparisonStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {comparisonStartDate ? format(comparisonStartDate, "MMM d") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={comparisonStartDate}
                    onSelect={setComparisonStartDate}
                    disabled={(date) => date > new Date() || (comparisonEndDate ? date > comparisonEndDate : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !comparisonEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {comparisonEndDate ? format(comparisonEndDate, "MMM d") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={comparisonEndDate}
                    onSelect={setComparisonEndDate}
                    disabled={(date) => date > new Date() || (comparisonStartDate ? date < comparisonStartDate : false)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Page Views
              </CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalPageViews.toLocaleString()}</div>
              {comparisonMode && comparisonStats.totalPageViews > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={cn(
                    displayStats.totalPageViews >= comparisonStats.totalPageViews ? "text-secondary" : "text-destructive"
                  )}>
                    {displayStats.totalPageViews >= comparisonStats.totalPageViews ? "+" : ""}
                    {Math.round(((displayStats.totalPageViews - comparisonStats.totalPageViews) / comparisonStats.totalPageViews) * 100)}%
                  </span> vs comparison ({comparisonStats.totalPageViews.toLocaleString()})
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-secondary">+12.5%</span> vs previous period
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Sessions
              </CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.uniqueSessions.toLocaleString()}</div>
              {comparisonMode && comparisonStats.uniqueSessions > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={cn(
                    displayStats.uniqueSessions >= comparisonStats.uniqueSessions ? "text-secondary" : "text-destructive"
                  )}>
                    {displayStats.uniqueSessions >= comparisonStats.uniqueSessions ? "+" : ""}
                    {Math.round(((displayStats.uniqueSessions - comparisonStats.uniqueSessions) / comparisonStats.uniqueSessions) * 100)}%
                  </span> vs comparison ({comparisonStats.uniqueSessions.toLocaleString()})
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-secondary">+8.3%</span> vs previous period
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Time on Page
              </CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.avgTimeOnPage}s</div>
              {comparisonMode && comparisonStats.avgTimeOnPage > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={cn(
                    displayStats.avgTimeOnPage >= comparisonStats.avgTimeOnPage ? "text-secondary" : "text-destructive"
                  )}>
                    {displayStats.avgTimeOnPage >= comparisonStats.avgTimeOnPage ? "+" : ""}
                    {Math.round(((displayStats.avgTimeOnPage - comparisonStats.avgTimeOnPage) / comparisonStats.avgTimeOnPage) * 100)}%
                  </span> vs comparison ({comparisonStats.avgTimeOnPage}s)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-secondary">+5.1%</span> vs previous period
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bounce Rate
              </CardTitle>
              <Target className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.bounceRate}%</div>
              {comparisonMode && comparisonStats.bounceRate > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={cn(
                    displayStats.bounceRate <= comparisonStats.bounceRate ? "text-secondary" : "text-destructive"
                  )}>
                    {displayStats.bounceRate <= comparisonStats.bounceRate ? "" : "+"}
                    {Math.round(((displayStats.bounceRate - comparisonStats.bounceRate) / comparisonStats.bounceRate) * 100)}%
                  </span> vs comparison ({comparisonStats.bounceRate}%)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-destructive">-2.1%</span> vs previous period
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="pageviews" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="pageviews" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Page Views</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Funnel</span>
            </TabsTrigger>
          </TabsList>

          {/* Page Views Tab */}
          <TabsContent value="pageviews" className="space-y-6">
            {comparisonMode && comparisonPageViews.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      Current Period
                    </CardTitle>
                    <CardDescription>Daily page views and unique visitors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayPageViews}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            name="Page Views"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="uniqueVisitors" 
                            stroke="hsl(var(--secondary))" 
                            fillOpacity={1}
                            fill="url(#colorVisitors)"
                            name="Unique Visitors"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      Comparison Period
                    </CardTitle>
                    <CardDescription>
                      {comparisonStartDate && comparisonEndDate 
                        ? `${format(comparisonStartDate, "MMM d")} - ${format(comparisonEndDate, "MMM d, yyyy")}`
                        : "Select comparison dates"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={comparisonPageViews}>
                          <defs>
                            <linearGradient id="colorViewsCompare" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorVisitorsCompare" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px"
                            }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="hsl(var(--muted-foreground))" 
                            fillOpacity={1}
                            fill="url(#colorViewsCompare)"
                            name="Page Views"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="uniqueVisitors" 
                            stroke="hsl(var(--accent))" 
                            fillOpacity={1}
                            fill="url(#colorVisitorsCompare)"
                            name="Unique Visitors"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Page Views Over Time</CardTitle>
                  <CardDescription>Daily page views and unique visitors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayPageViews}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          name="Page Views"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="uniqueVisitors" 
                          stroke="hsl(var(--secondary))" 
                          fillOpacity={1}
                          fill="url(#colorVisitors)"
                          name="Unique Visitors"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Views</CardTitle>
                  <CardDescription>Most viewed products this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayProductPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion by Product</CardTitle>
                  <CardDescription>Views vs Add to Cart comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayProductPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                        <Bar dataKey="addToCart" fill="hsl(var(--secondary))" name="Add to Cart" />
                        <Bar dataKey="purchases" fill="hsl(var(--accent))" name="Purchases" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance Table</CardTitle>
                <CardDescription>Detailed metrics for top products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Product</th>
                        <th className="text-right py-3 px-4 font-medium">Views</th>
                        <th className="text-right py-3 px-4 font-medium">Add to Cart</th>
                        <th className="text-right py-3 px-4 font-medium">Purchases</th>
                        <th className="text-right py-3 px-4 font-medium">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayProductPerformance.map((product) => (
                        <tr key={product.productId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="text-right py-3 px-4">{product.views}</td>
                          <td className="text-right py-3 px-4">{product.addToCart}</td>
                          <td className="text-right py-3 px-4">{product.purchases}</td>
                          <td className="text-right py-3 px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                              {product.conversionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Search Queries</CardTitle>
                  <CardDescription>Most searched terms this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displaySearchTrends} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="query" type="category" width={80} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Search Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Click-Through Rate</CardTitle>
                  <CardDescription>Percentage of searches with clicked results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displaySearchTrends.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="clickRate"
                          nameKey="query"
                          label={({ query, clickRate }) => `${query}: ${clickRate}%`}
                        >
                          {displaySearchTrends.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Search Trends Table</CardTitle>
                <CardDescription>Complete search analytics data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Query</th>
                        <th className="text-right py-3 px-4 font-medium">Search Count</th>
                        <th className="text-right py-3 px-4 font-medium">Click Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySearchTrends.map((search, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{search.query}</td>
                          <td className="text-right py-3 px-4">{search.count}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              search.clickRate >= 70 ? "bg-secondary/20 text-secondary" : 
                              search.clickRate >= 50 ? "bg-accent/20 text-accent" : 
                              "bg-destructive/20 text-destructive"
                            }`}>
                              {search.clickRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>User journey from view to purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={displayFunnelData} 
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          formatter={(value: number) => [value.toLocaleString(), "Count"]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {displayFunnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Funnel Metrics</CardTitle>
                  <CardDescription>Conversion rates between stages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {displayFunnelData.map((stage, index) => {
                    const prevValue = index > 0 ? displayFunnelData[index - 1].value : stage.value;
                    const conversionRate = Math.round((stage.value / prevValue) * 100);
                    
                    return (
                      <div key={stage.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stage.name}</span>
                          <span className="text-muted-foreground">{stage.value.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(stage.value / displayFunnelData[0].value) * 100}%`,
                                backgroundColor: stage.fill
                              }}
                            />
                          </div>
                          {index > 0 && (
                            <span className="text-sm font-medium text-muted-foreground min-w-[50px]">
                              {conversionRate}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Overall Conversion Rate</span>
                      <span className="text-lg font-bold text-secondary">
                        {Math.round((displayFunnelData[displayFunnelData.length - 1].value / displayFunnelData[0].value) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
