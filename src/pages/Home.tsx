import { Link } from "react-router-dom";
import { useLessons, useLessonProgress, Lesson } from "@/hooks/useLessons";
import { useProfile } from "@/hooks/useProfile";
import { Mascot } from "@/components/Mascot";
import { Star, Lock, BookOpen, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const Home = () => {
  const { data: profile } = useProfile();
  const { data: lessons = [] } = useLessons();
  const { data: progress = [] } = useLessonProgress();

  const progressMap = new Map(progress.map((p) => [p.lesson_id, p]));
  const englishLessons = lessons.filter((l) => l.subject === "english");
  const mathLessons = lessons.filter((l) => l.subject === "math");

  return (
    <div className="space-y-6 pb-4">
      <div className="candy-card bg-gradient-sky text-white flex items-center gap-3 !p-4">
        <Mascot mood="happy" size={70} />
        <div className="flex-1">
          <p className="font-display text-xl leading-tight">
            Hi {profile?.display_name}! 👋
          </p>
          <p className="text-sm opacity-95 mt-1">
            Ready for today's adventure? Tap a lesson to start!
          </p>
        </div>
      </div>

      <Path
        title="English"
        icon={<BookOpen className="w-5 h-5" />}
        gradient="bg-gradient-mint"
        lessons={englishLessons}
        progressMap={progressMap}
      />
      <Path
        title="Math"
        icon={<Calculator className="w-5 h-5" />}
        gradient="bg-gradient-sunshine"
        lessons={mathLessons}
        progressMap={progressMap}
      />
    </div>
  );
};

const Path = ({
  title, icon, gradient, lessons, progressMap,
}: {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  lessons: Lesson[];
  progressMap: Map<string, any>;
}) => {
  // first uncompleted index unlocks; rest locked
  let firstIncomplete = lessons.findIndex((l) => !progressMap.has(l.id));
  if (firstIncomplete === -1) firstIncomplete = lessons.length;

  return (
    <section>
      <div className={cn("flex items-center gap-2 px-2 py-2 rounded-full text-white font-display font-bold w-fit", gradient)}>
        {icon}
        <span>{title}</span>
      </div>
      <ol className="mt-3 space-y-3">
        {lessons.map((lesson, i) => {
          const done = progressMap.has(lesson.id);
          const stars = progressMap.get(lesson.id)?.stars ?? 0;
          const locked = i > firstIncomplete;
          const offset = i % 4; // gentle path zigzag
          return (
            <li
              key={lesson.id}
              style={{ marginLeft: `${[0, 24, 48, 24][offset]}px` }}
            >
              <LessonNode
                lesson={lesson}
                done={done}
                stars={stars}
                locked={locked}
                gradient={gradient}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const LessonNode = ({ lesson, done, stars, locked, gradient }: any) => {
  const inner = (
    <div className={cn(
      "candy-card flex items-center gap-4 !py-4 transition-transform",
      !locked && "press-down",
      locked && "opacity-60"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0",
        locked ? "bg-muted-foreground" : gradient,
        done && !locked && "ring-4 ring-success/30"
      )}>
        {locked ? <Lock className="w-6 h-6" /> : <span className="font-display font-bold text-xl">{lesson.order_index}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-lg leading-tight">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">{lesson.description}</p>
        {done && (
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3].map((s) => (
              <Star key={s} className={cn("w-4 h-4", s <= stars ? "fill-secondary text-secondary" : "text-muted")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  if (locked) return inner;
  return <Link to={`/lesson/${lesson.id}`} className="block">{inner}</Link>;
};

export default Home;
