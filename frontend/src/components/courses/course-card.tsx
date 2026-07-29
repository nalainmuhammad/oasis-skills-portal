import Link from "next/link";
import { Course } from "@/types";
import { BookOpen, Clock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CourseCard({ course }: { course: Course }) {
  const isBeginner = course.difficulty_level === 'beginner';
  const isIntermediate = course.difficulty_level === 'intermediate';
  const isAdvanced = course.difficulty_level === 'advanced';

  const gradientClass = isBeginner
    ? 'from-oasis-emerald/20 to-oasis-bgSecondary'
    : isIntermediate
    ? 'from-oasis-gold/20 to-oasis-bgSecondary'
    : 'from-oasis-cyan/20 to-oasis-bgSecondary';

  const badgeClass = isBeginner
    ? 'bg-oasis-emerald text-black hover:bg-oasis-emerald'
    : isIntermediate
    ? 'bg-oasis-gold text-black hover:bg-oasis-gold'
    : 'bg-oasis-cyan text-black hover:bg-oasis-cyan';

  const textClass = isBeginner
    ? 'text-oasis-emerald group-hover:text-oasis-emerald'
    : isIntermediate
    ? 'text-oasis-gold group-hover:text-oasis-gold'
    : 'text-oasis-cyan group-hover:text-oasis-cyan';

  const shadowClass = isBeginner
    ? 'hover:shadow-[0_0_30px_rgba(0,212,126,0.15)]'
    : isIntermediate
    ? 'hover:shadow-[0_0_30px_rgba(255,198,65,0.15)]'
    : 'hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]';

  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <div className={`glass-card rounded-2xl overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col ${shadowClass}`}>
        <div className={`h-48 bg-gradient-to-br ${gradientClass} relative overflow-hidden flex-shrink-0`}>
          <div className="absolute top-4 left-4 z-10">
            <Badge className={badgeClass}>
              {isBeginner ? 'Beginner' : isIntermediate ? 'Intermediate' : 'Advanced'}
            </Badge>
          </div>
          
          {course.thumbnail_url ? (
             <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
              <BookOpen size={48} className="text-foreground" />
            </div>
          )}
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          {course.category && (
            <div className={`text-sm font-medium mb-2 ${textClass.split(' ')[0]}`}>{course.category.name}</div>
          )}
          <h3 className={`text-xl font-display font-bold text-foreground mb-2 transition-colors ${textClass.split(' ')[1]}`}>
            {course.title}
          </h3>
          <p className="text-oasis-muted text-sm mb-6 flex-grow line-clamp-2">
            {course.subtitle || course.title}
          </p>
          
          <div className="flex items-center justify-between text-sm text-foreground/60 pt-4 border-t border-foreground/5 mt-auto">
            <div className="flex items-center gap-1.5">
              <PlayCircle size={16} /> 
              <span>{course.module_count} Modules</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} /> 
              <span>{Math.floor(course.estimated_duration_minutes / 60)}h {course.estimated_duration_minutes % 60}m</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
