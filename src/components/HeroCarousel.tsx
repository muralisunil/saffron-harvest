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
    <div className="relative w-full h-[500px] md:h-[60vh] overflow-hidden rounded-xl">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="relative h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 animate-fade-in">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-white/90 mb-8 animate-slide-up">
                {slide.subtitle}
              </p>
              <div className="animate-scale-in">
                <Link to="/products">
                  <Button size="lg" className="shadow-elevated">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
        onClick={prev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
        onClick={next}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === current ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
