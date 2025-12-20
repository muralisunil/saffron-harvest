import { Link } from "react-router-dom";
import { ArrowRight, Tag, Percent, Gift, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveOffer {
  id: string;
  name: string;
  description: string | null;
  marketing_text: string | null;
  offer_type: string;
}

const offerIcons: Record<string, React.ReactNode> = {
  percent_discount: <Percent className="h-5 w-5" />,
  flat_discount: <Tag className="h-5 w-5" />,
  buy_x_get_y: <Gift className="h-5 w-5" />,
  free_item: <Gift className="h-5 w-5" />,
  default: <Sparkles className="h-5 w-5" />,
};

const offerGradients: Record<string, string> = {
  percent_discount: "from-primary via-primary/95 to-amber-500",
  flat_discount: "from-emerald-600 via-emerald-500 to-teal-400",
  buy_x_get_y: "from-violet-600 via-purple-500 to-fuchsia-400",
  free_item: "from-rose-600 via-pink-500 to-orange-400",
  default: "from-primary via-primary/95 to-amber-500",
};

const PromoBanner = () => {
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, name, description, marketing_text, offer_type")
        .eq("status", "active")
        .order("priority", { ascending: false })
        .limit(5);

      if (!error && data && data.length > 0) {
        setOffers(data);
      }
      setIsLoading(false);
    };

    fetchOffers();
  }, []);

  // Auto-rotate offers
  useEffect(() => {
    if (offers.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [offers.length]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden relative border-0 shadow-2xl animate-pulse">
        <div className="h-48 md:h-56 bg-muted" />
      </Card>
    );
  }

  if (offers.length === 0) {
    // Fallback to static banner if no active offers
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Link to="/products">
          <Card className="overflow-hidden relative cursor-pointer group border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-amber-500" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-5 bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm px-5 py-1.5 font-medium">
                  ✨ Limited Time Offer
                </Badge>
                <h3 className="text-3xl md:text-5xl font-display font-bold mb-4 text-white leading-tight">
                  Up to 50% off on Selected Items
                </h3>
                <p className="text-white/80 text-lg md:text-xl max-w-xl">
                  Don't miss out on amazing deals across all categories
                </p>
              </div>
              <Button 
                size="lg" 
                className="h-16 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 bg-white text-primary hover:bg-white/95"
              >
                Shop Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  const currentOffer = offers[currentIndex];
  const gradient = offerGradients[currentOffer.offer_type] || offerGradients.default;
  const icon = offerIcons[currentOffer.offer_type] || offerIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link to="/products">
        <Card className="overflow-hidden relative cursor-pointer group border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentOffer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]" />
            </motion.div>
          </AnimatePresence>
          
          {/* Floating decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentOffer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="flex-1 text-center md:text-left"
              >
                <Badge className="mb-5 bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm px-5 py-1.5 font-medium inline-flex items-center gap-2">
                  {icon}
                  Active Offer
                </Badge>
                <h3 className="text-3xl md:text-5xl font-display font-bold mb-4 text-white leading-tight">
                  {currentOffer.marketing_text || currentOffer.name}
                </h3>
                <p className="text-white/80 text-lg md:text-xl max-w-xl">
                  {currentOffer.description || "Shop now and save on your order!"}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg" 
                className="h-16 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 bg-white text-primary hover:bg-white/95"
              >
                Shop Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {/* Offer indicators */}
              {offers.length > 1 && (
                <div className="flex gap-2">
                  {offers.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? "bg-white w-6" 
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default PromoBanner;
