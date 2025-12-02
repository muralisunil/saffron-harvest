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
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="relative h-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-3 leading-tight">
                {slide.title}
              </h2>
              <p className="text-base md:text-lg text-white/90 mb-6">
                {slide.subtitle}
              </p>
              <div>
                <Link to="/products">
                  <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
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
