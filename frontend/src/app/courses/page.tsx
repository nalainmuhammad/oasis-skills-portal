export const dynamic = "force-dynamic";

import { getCourses, getCategories } from "@/lib/api/courses";
import { CourseCard } from "@/components/courses/course-card";
import { Search, SlidersHorizontal } from "lucide-react";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const category_slug = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;
  const difficulty_level = typeof resolvedSearchParams.difficulty === 'string' ? resolvedSearchParams.difficulty : undefined;
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;

  const [{ items: courses }, categories] = await Promise.all([
    getCourses({ category_slug, difficulty_level, search }),
    getCategories()
  ]);

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20">
      {/* Header */}
      <section className="py-12 md:py-20 bg-oasis-bgSecondary/30 border-b border-foreground/5" data-animate="fade-up">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Course Catalog
            </h1>
            <p className="text-lg text-oasis-muted">
              Discover world-class courses designed to accelerate your career. Free forever.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-grow">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-8" data-animate="fade-right">
              <div>
                <div className="flex items-center gap-2 text-foreground font-medium mb-4">
                  <SlidersHorizontal size={18} />
                  <span>Filters</span>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/60 mb-3 uppercase tracking-wider">Categories</h3>
                    <div className="space-y-2">
                      <a href={`/courses?${difficulty_level ? `difficulty=${difficulty_level}` : ''}${search ? `${difficulty_level ? '&' : ''}q=${search}` : ''}`} className={`block text-sm ${!category_slug ? 'text-oasis-emerald font-medium' : 'text-oasis-muted hover:text-foreground'}`}>
                        All Categories
                      </a>
                      {categories.map(cat => (
                        <a key={cat.slug} href={`/courses?category=${cat.slug}${difficulty_level ? `&difficulty=${difficulty_level}` : ''}${search ? `&q=${search}` : ''}`} className={`block text-sm ${category_slug === cat.slug ? 'text-oasis-emerald font-medium' : 'text-oasis-muted hover:text-foreground'}`}>
                          {cat.name}
                        </a>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-foreground/60 mb-3 uppercase tracking-wider">Difficulty</h3>
                    <div className="space-y-2">
                      <a href={`/courses?${category_slug ? `category=${category_slug}` : ''}${search ? `${category_slug ? '&' : ''}q=${search}` : ''}`} className={`block text-sm ${!difficulty_level ? 'text-oasis-emerald font-medium' : 'text-oasis-muted hover:text-foreground'}`}>
                        All Levels
                      </a>
                      {['beginner', 'intermediate', 'advanced'].map(diff => (
                        <a key={diff} href={`/courses?difficulty=${diff}${category_slug ? `&category=${category_slug}` : ''}${search ? `&q=${search}` : ''}`} className={`block text-sm capitalize ${difficulty_level === diff ? 'text-oasis-emerald font-medium' : 'text-oasis-muted hover:text-foreground'}`}>
                          {diff}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Grid */}
            <div className="flex-grow">
              <form action="/courses" method="GET" className="mb-8 flex items-center bg-foreground/5 border border-foreground/10 rounded-full px-4 py-2 focus-within:border-oasis-emerald/50 transition-colors" data-animate="fade-down">
                <Search size={20} className="text-foreground/40 mr-2" />
                <input 
                  type="text" 
                  name="q"
                  placeholder="Search courses..." 
                  className="bg-transparent border-none outline-none text-foreground w-full placeholder:text-foreground/40"
                  defaultValue={search || ''}
                />
                {category_slug && <input type="hidden" name="category" value={category_slug} />}
                {difficulty_level && <input type="hidden" name="difficulty" value={difficulty_level} />}
                <button type="submit" className="hidden">Search</button>
              </form>

              {courses.length === 0 ? (
                <div className="text-center py-20 bg-foreground/5 rounded-2xl border border-foreground/10" data-animate="scale-in">
                  <h3 className="text-xl font-medium text-foreground mb-2">No courses found</h3>
                  <p className="text-oasis-muted">Try adjusting your filters or search query.</p>
                  <a href="/courses" className="inline-block mt-4 text-oasis-emerald hover:underline">Clear filters</a>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-grid-animate>
                  {courses.map(course => (
                    <CourseCard key={course.slug} course={course} />
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
