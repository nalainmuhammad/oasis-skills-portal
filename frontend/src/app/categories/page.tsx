export const dynamic = "force-dynamic";

import { getCategories } from "@/lib/api/courses";
import Link from "next/link";
import { Folder, ArrowRight } from "lucide-react";

export default async function CategoriesIndexPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-oasis-bg">
      <section className="py-12 md:py-20 border-b border-foreground/5 relative overflow-hidden" data-animate="fade-up">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-oasis-emerald/5 blur-[100px] -z-10"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Explore <span className="text-oasis-emerald">Categories</span>
            </h1>
            <p className="text-lg text-oasis-muted">
              Browse our complete catalog of skills and certifications by topic area.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-grid-animate>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="glass-card p-8 rounded-2xl border border-foreground/5 hover:border-oasis-emerald/30 hover:bg-foreground/5 transition-all group flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-xl bg-oasis-emerald/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Folder className="text-oasis-emerald" size={24} />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{category.name}</h3>
                <div className="mt-auto pt-4 flex items-center text-sm font-medium text-oasis-emerald/80 group-hover:text-oasis-emerald">
                  View Courses <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
          
          {categories.length === 0 && (
             <div className="text-center py-16 text-foreground/40" data-animate="scale-in">
               No categories available at the moment.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
