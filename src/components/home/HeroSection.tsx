import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { Link } from "react-router-dom";

const slides = [
  {
    image: hero1,
    title: "Authentic Indian Groceries",
    subtitle: "Fresh spices, staples & more delivered to your doorstep",
  },
  {
    image: hero2,
    title: "Premium Quality Spices",
    subtitle: "Experience the rich flavors of traditional Indian cuisine",
  },
  {
    image: hero3,
    title: "Trusted Brands",
    subtitle: "Shop from India's favorite grocery brands",
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[550px] md:h-[600px] overflow-hidden">
      {/* Simple crossfade - all slides rendered, opacity controlled */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div className="relative h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="object-cover w-full h-full"
            />
            {/* Extended gradient that bleeds into page */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
            
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-4xl">
              <div 
                className={`space-y-6 transition-all duration-500 delay-200 ${
                  index === current ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white leading-[1.05] tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="pt-4 flex gap-4">
                  <Link to="/products">
                    <Button 
                      size="lg" 
                      className="h-14 px-10 text-base font-semibold shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90"
                    >
                      Shop Now
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="h-14 px-8 text-base font-semibold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-300"
                    >
                      View Deals
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 border border-white/20 text-white transition-all duration-300"
        onClick={prev}
      >
        <ChevronLeft className="h-7 w-7" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 border border-white/20 text-white transition-all duration-300"
        onClick={next}
      >
        <ChevronRight className="h-7 w-7" />
      </Button>

      {/* Indicator dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === current 
                ? "w-12 bg-white shadow-lg" 
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
