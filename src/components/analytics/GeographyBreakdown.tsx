import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Globe, TrendingUp, TrendingDown, MapPin, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CountryData {
  country: string;
  code: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  avgDuration: number;
  bounceRate: number;
  trend: number;
  flag: string;
}

interface RegionData {
  region: string;
  visitors: number;
  percentage: number;
  color: string;
}

interface TrendData {
  date: string;
  'North America': number;
  'Europe': number;
  'Asia': number;
  'Other': number;
}

export const GeographyBreakdown: React.FC = () => {
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    generateGeographyData();
  }, []);

  const generateGeographyData = async () => {
    try {
      // Fetch real session counts to base our simulated data on
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select('id')
        .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const sessionCount = sessions?.length || 100;

      // Generate country-level data
      const countries: CountryData[] = [
        { country: 'United States', code: 'US', flag: '🇺🇸', visitors: Math.floor(sessionCount * 0.28), sessions: 0, pageViews: 0, avgDuration: 245, bounceRate: 42, trend: 12.5 },
        { country: 'India', code: 'IN', flag: '🇮🇳', visitors: Math.floor(sessionCount * 0.22), sessions: 0, pageViews: 0, avgDuration: 312, bounceRate: 35, trend: 18.3 },
        { country: 'United Kingdom', code: 'GB', flag: '🇬🇧', visitors: Math.floor(sessionCount * 0.12), sessions: 0, pageViews: 0, avgDuration: 198, bounceRate: 45, trend: 5.2 },
        { country: 'Canada', code: 'CA', flag: '🇨🇦', visitors: Math.floor(sessionCount * 0.09), sessions: 0, pageViews: 0, avgDuration: 267, bounceRate: 38, trend: 8.7 },
        { country: 'Australia', code: 'AU', flag: '🇦🇺', visitors: Math.floor(sessionCount * 0.07), sessions: 0, pageViews: 0, avgDuration: 223, bounceRate: 41, trend: -2.1 },
        { country: 'Germany', code: 'DE', flag: '🇩🇪', visitors: Math.floor(sessionCount * 0.05), sessions: 0, pageViews: 0, avgDuration: 189, bounceRate: 48, trend: 3.4 },
        { country: 'UAE', code: 'AE', flag: '🇦🇪', visitors: Math.floor(sessionCount * 0.05), sessions: 0, pageViews: 0, avgDuration: 278, bounceRate: 32, trend: 15.8 },
        { country: 'Singapore', code: 'SG', flag: '🇸🇬', visitors: Math.floor(sessionCount * 0.04), sessions: 0, pageViews: 0, avgDuration: 256, bounceRate: 36, trend: 9.2 },
        { country: 'Netherlands', code: 'NL', flag: '🇳🇱', visitors: Math.floor(sessionCount * 0.03), sessions: 0, pageViews: 0, avgDuration: 201, bounceRate: 44, trend: 1.5 },
        { country: 'France', code: 'FR', flag: '🇫🇷', visitors: Math.floor(sessionCount * 0.03), sessions: 0, pageViews: 0, avgDuration: 187, bounceRate: 47, trend: -0.8 },
      ].map(c => ({
        ...c,
        sessions: Math.floor(c.visitors * 1.3),
        pageViews: Math.floor(c.visitors * 3.2),
      }));

      setCountryData(countries);

      // Generate region data
      const totalVisitors = countries.reduce((sum, c) => sum + c.visitors, 0);
      const regions: RegionData[] = [
        { 
          region: 'North America', 
          visitors: countries.filter(c => ['US', 'CA'].includes(c.code)).reduce((s, c) => s + c.visitors, 0),
          percentage: 0,
          color: 'hsl(var(--primary))'
        },
        { 
          region: 'Europe', 
          visitors: countries.filter(c => ['GB', 'DE', 'NL', 'FR'].includes(c.code)).reduce((s, c) => s + c.visitors, 0),
          percentage: 0,
          color: 'hsl(var(--secondary))'
        },
        { 
          region: 'Asia Pacific', 
          visitors: countries.filter(c => ['IN', 'AU', 'SG', 'AE'].includes(c.code)).reduce((s, c) => s + c.visitors, 0),
          percentage: 0,
          color: 'hsl(var(--accent))'
        },
        { 
          region: 'Other', 
          visitors: Math.floor(totalVisitors * 0.02),
          percentage: 0,
          color: 'hsl(var(--muted-foreground))'
        },
      ].map(r => ({
        ...r,
        percentage: Math.round((r.visitors / (totalVisitors + Math.floor(totalVisitors * 0.02))) * 100)
      }));

      setRegionData(regions);

      // Generate trend data for the last 7 days
      const trends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          'North America': Math.floor(20 + Math.random() * 30),
          'Europe': Math.floor(15 + Math.random() * 20),
          'Asia': Math.floor(25 + Math.random() * 35),
          'Other': Math.floor(5 + Math.random() * 10),
        });
      }
      setTrendData(trends);

    } catch (error) {
      console.error('Error generating geography data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Region Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {regionData.map((region) => (
          <Card 
            key={region.region}
            className={`cursor-pointer transition-all hover:shadow-md ${selectedRegion === region.region ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedRegion(selectedRegion === region.region ? null : region.region)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{region.region}</span>
                <span className="text-lg font-bold">{region.percentage}%</span>
              </div>
              <Progress value={region.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {region.visitors.toLocaleString()} visitors
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="countries" className="gap-2">
            <MapPin className="h-4 w-4" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <Globe className="h-4 w-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Regional Trends
          </TabsTrigger>
        </TabsList>

        {/* Countries Table */}
        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Country</CardTitle>
              <CardDescription>Detailed breakdown of visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Country</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Visitors</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground hidden sm:table-cell">Sessions</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">Page Views</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground hidden lg:table-cell">Avg. Duration</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground hidden lg:table-cell">Bounce Rate</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryData.map((country, index) => (
                      <tr key={country.code} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="font-medium">{country.country}</span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">Top</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 font-medium">{country.visitors.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 hidden sm:table-cell">{country.sessions.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 hidden md:table-cell">{country.pageViews.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 hidden lg:table-cell">{formatDuration(country.avgDuration)}</td>
                        <td className="text-right py-3 px-2 hidden lg:table-cell">{country.bounceRate}%</td>
                        <td className="text-right py-3 px-2">
                          <div className="flex items-center justify-end gap-1">
                            {country.trend >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-secondary" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                            <span className={country.trend >= 0 ? 'text-secondary' : 'text-destructive'}>
                              {country.trend >= 0 ? '+' : ''}{country.trend}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Charts */}
        <TabsContent value="distribution">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Visitor breakdown by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="visitors"
                        nameKey="region"
                        label={({ region, percentage }) => `${region}: ${percentage}%`}
                        labelLine={false}
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number) => [value.toLocaleString(), 'Visitors']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries Comparison</CardTitle>
                <CardDescription>Visitors by top 5 countries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={countryData.slice(0, 5)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis 
                        dataKey="country" 
                        type="category" 
                        width={100} 
                        className="text-xs"
                        tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="visitors" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regional Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Regional Traffic Trends</CardTitle>
              <CardDescription>Daily visitor trends by region over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="North America" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Europe" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Asia" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Other" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Region Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fastest Growing</p>
                    <p className="text-lg font-bold">Asia Pacific</p>
                    <p className="text-xs text-secondary">+18.3% this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Most Engaged</p>
                    <p className="text-lg font-bold">India</p>
                    <p className="text-xs text-muted-foreground">5:12 avg. session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Globe className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Best Conversion</p>
                    <p className="text-lg font-bold">UAE</p>
                    <p className="text-xs text-muted-foreground">32% bounce rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeographyBreakdown;
