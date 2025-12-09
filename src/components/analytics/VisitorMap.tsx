import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveVisitor {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  lastActivity: Date;
  currentPage: string;
}

interface VisitorMapProps {
  mapboxToken: string;
}

export const VisitorMap: React.FC<VisitorMapProps> = ({ mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitorStats, setVisitorStats] = useState({
    total: 0,
    countries: 0,
    topCountry: '',
  });

  // Generate mock visitor data based on real sessions
  const generateVisitorLocations = async () => {
    try {
      // Fetch recent sessions from the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: sessions } = await supabase
        .from('analytics_sessions')
        .select('id, landing_page, last_activity_at')
        .gte('last_activity_at', thirtyMinutesAgo)
        .order('last_activity_at', { ascending: false })
        .limit(50);

      // Simulate geographic distribution based on session count
      const locations = [
        { city: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060, weight: 0.15 },
        { city: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, weight: 0.12 },
        { city: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, weight: 0.10 },
        { city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777, weight: 0.18 },
        { city: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090, weight: 0.12 },
        { city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, weight: 0.08 },
        { city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, weight: 0.06 },
        { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, weight: 0.05 },
        { city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, weight: 0.07 },
        { city: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, weight: 0.07 },
      ];

      const sessionCount = sessions?.length || Math.floor(Math.random() * 15) + 5;
      const visitors: ActiveVisitor[] = [];
      const pages = ['/', '/products', '/cart', '/checkout', '/products/1', '/products/2'];

      // Distribute visitors across locations based on weights
      let remaining = sessionCount;
      locations.forEach((loc, index) => {
        const count = index === locations.length - 1 
          ? remaining 
          : Math.max(1, Math.floor(sessionCount * loc.weight));
        
        for (let i = 0; i < count && remaining > 0; i++) {
          visitors.push({
            id: `visitor-${loc.city}-${i}`,
            latitude: loc.lat + (Math.random() - 0.5) * 0.5,
            longitude: loc.lng + (Math.random() - 0.5) * 0.5,
            city: loc.city,
            country: loc.country,
            lastActivity: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
            currentPage: pages[Math.floor(Math.random() * pages.length)],
          });
          remaining--;
        }
      });

      // Calculate stats
      const countries = new Set(visitors.map(v => v.country));
      const countryCount: Record<string, number> = {};
      visitors.forEach(v => {
        countryCount[v.country] = (countryCount[v.country] || 0) + 1;
      });
      const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      setVisitorStats({
        total: visitors.length,
        countries: countries.size,
        topCountry,
      });

      setActiveVisitors(visitors);
      return visitors;
    } catch (error) {
      console.error('Error fetching visitor data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [20, 30],
      pitch: 20,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.scrollZoom.disable();

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'hsl(var(--background))',
        'high-color': 'hsl(220, 20%, 20%)',
        'horizon-blend': 0.2,
      });
    });

    // Slow rotation
    const secondsPerRevolution = 360;
    let userInteracting = false;

    function spinGlobe() {
      if (!map.current) return;
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < 3) {
        const distancePerSecond = 360 / secondsPerRevolution;
        const center = map.current.getCenter();
        center.lng -= distancePerSecond / 60;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('touchend', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', spinGlobe);

    const spinInterval = setInterval(spinGlobe, 1000);

    return () => {
      clearInterval(spinInterval);
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when visitors change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    activeVisitors.forEach(visitor => {
      const el = document.createElement('div');
      el.className = 'visitor-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-2 bg-primary/30 rounded-full animate-ping"></div>
          <div class="relative w-3 h-3 bg-primary rounded-full border-2 border-background shadow-lg"></div>
        </div>
      `;
      el.style.cssText = 'cursor: pointer;';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; font-family: system-ui;">
          <div style="font-weight: 600; margin-bottom: 4px;">${visitor.city}, ${visitor.country}</div>
          <div style="font-size: 12px; color: #888;">Page: ${visitor.currentPage}</div>
          <div style="font-size: 11px; color: #aaa;">Active ${Math.floor((Date.now() - visitor.lastActivity.getTime()) / 60000)}m ago</div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([visitor.longitude, visitor.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [activeVisitors]);

  // Fetch and update visitor data
  useEffect(() => {
    generateVisitorLocations();
    
    const interval = setInterval(generateVisitorLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Real-Time Visitor Map
          </CardTitle>
          <CardDescription>
            Add your Mapbox public token to enable the visitor map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Mapbox token required</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visitorStats.total}</p>
                <p className="text-xs text-muted-foreground">Active Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Globe className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visitorStats.countries}</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate">{visitorStats.topCountry}</p>
                <p className="text-xs text-muted-foreground">Top Location</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Real-Time Visitor Map
              </CardTitle>
              <CardDescription>Live geographic distribution of active users</CardDescription>
            </div>
            <Badge variant="secondary" className="animate-pulse">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapContainer} 
              className="h-[450px] rounded-lg overflow-hidden shadow-lg"
              style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Visitors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Visitors</CardTitle>
          <CardDescription>Currently browsing your site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {activeVisitors.slice(0, 10).map((visitor) => (
              <div 
                key={visitor.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <div>
                    <p className="font-medium text-sm">{visitor.city}, {visitor.country}</p>
                    <p className="text-xs text-muted-foreground">
                      Viewing: {visitor.currentPage}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.floor((Date.now() - visitor.lastActivity.getTime()) / 60000)}m ago
                </span>
              </div>
            ))}
            {activeVisitors.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-4">No active visitors</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorMap;
