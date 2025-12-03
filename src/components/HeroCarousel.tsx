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

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[480px] md:h-[520px] overflow-hidden rounded-2xl shadow-2xl">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            index === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <div className="relative h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="object-cover w-full h-full"
            />
            {/* Sophisticated multi-layer gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-20 max-w-3xl">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-white/95 max-w-lg leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="pt-2">
                  <Link to="/products">
                    <Button 
                      size="lg" 
                      className="h-14 px-8 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90"
                    >
                      Shop Now
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Elegant navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 border border-white/30 text-white transition-all duration-300"
        onClick={prev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 border border-white/30 text-white transition-all duration-300"
        onClick={next}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Refined indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              index === current 
                ? "w-10 bg-white shadow-lg" 
                : "w-2.5 bg-white/40 hover:bg-white/60"
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
