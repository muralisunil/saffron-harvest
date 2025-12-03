import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Package, ShoppingBag, Sparkles, Tag } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { name: "Staples & Grains", icon: Package, gradient: "from-amber-500 to-orange-600" },
  { name: "Snacks", icon: ShoppingBag, gradient: "from-rose-500 to-pink-600" },
  { name: "Beverages", icon: Sparkles, gradient: "from-blue-500 to-indigo-600" },
  { name: "Instant Food", icon: Tag, gradient: "from-emerald-500 to-teal-600" },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } }
};

const CategoryCards = () => {
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
    >
      {categories.map((category) => (
        <motion.div key={category.name} variants={item}>
          <Link to="/products">
            <Card className="overflow-hidden cursor-pointer group relative border-0 bg-card/90 backdrop-blur-md shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3">
              <div className="relative p-6 md:p-8">
                <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <category.icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="font-bold text-base md:text-lg text-center mt-5 text-foreground group-hover:text-primary transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground text-center mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Explore collection →
                </p>
              </div>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CategoryCards;
