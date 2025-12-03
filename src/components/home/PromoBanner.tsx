import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PromoBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Link to="/products">
        <Card className="overflow-hidden relative cursor-pointer group border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
          {/* Rich gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-amber-500" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]" />
          
          {/* Floating decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
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
};

export default PromoBanner;
