import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLesson } from "@/hooks/useLessons";
import { useAuth } from "@/contexts/AuthContext";
import { ExerciseView } from "@/components/exercises/ExerciseView";
import { Mascot } from "@/components/Mascot";
import { CandyButton } from "@/components/CandyButton";
import { completeLesson } from "@/lib/gameLogic";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LessonPlayer = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: lesson, isLoading } = useLesson(id);

  const [step, setStep] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState<any>(null);

  useEffect(() => { setStep(0); setCorrectCount(0); setFeedback(null); }, [id]);

  if (isLoading || !lesson) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  const exercises = lesson.content.exercises;
  const total = exercises.length;
  const ex = exercises[step];
  const progress = (step / total) * 100;

  const handleAnswer = (correct: boolean) => {
    if (feedback) return;
    if (correct) {
      setCorrectCount((c) => c + 1);
      setFeedback("correct");
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
    } else {
      setFeedback("wrong");
    }
  };

  const next = async () => {
    setFeedback(null);
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      // finish
      const stars = correctCount === total ? 3 : correctCount >= total - 1 ? 2 : 1;
      const score = Math.round((correctCount / total) * 100);
      const result = await completeLesson({
        userId: user!.id,
        lessonId: lesson.id,
        stars, score,
        xpReward: lesson.xp_reward,
      });
      qc.invalidateQueries();
      setDone({ stars, score, ...result });
    }
  };

  if (done) return <Results lesson={lesson} done={done} onContinue={() => nav("/")} />;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button onClick={() => nav("/")} className="p-2"><X className="w-6 h-6 text-muted-foreground" /></button>
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-success transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        <div key={step} className="animate-bounce-in">
          <ExerciseView exercise={ex} onAnswer={handleAnswer} />
        </div>
      </div>

      {feedback && (
        <div className={cn(
          "p-5 animate-bounce-in",
          feedback === "correct" ? "bg-success/15" : "bg-coral/15"
        )}>
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-display font-bold text-lg">
              {feedback === "correct" ? (
                <><div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center"><Check /></div><span className="text-success">Nice!</span></>
              ) : (
                <><div className="w-10 h-10 rounded-full bg-coral text-white flex items-center justify-center"><X /></div><span className="text-coral">Try next time!</span></>
              )}
            </div>
            <CandyButton onClick={next} variant={feedback === "correct" ? "success" : "coral"}>
              {step + 1 < total ? "Next" : "Finish"}
            </CandyButton>
          </div>
        </div>
      )}
    </div>
  );
};

const Results = ({ lesson, done, onContinue }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center space-y-5 relative overflow-hidden">
    {/* Confetti */}
    {Array.from({ length: 18 }).map((_, i) => (
      <span
        key={i}
        className="absolute top-0 text-2xl animate-confetti"
        style={{
          left: `${(i * 7) % 100}%`,
          animationDelay: `${(i % 6) * 0.1}s`,
          color: ["#34b3f1","#ffce4e","#52c785","#ff7860","#a560f5"][i % 5],
        }}
      >★</span>
    ))}
    <Mascot mood="cheer" size={160} />
    <h1 className="text-4xl">Lesson complete!</h1>
    <div className="flex gap-2">
      {[1,2,3].map((s) => (
        <Star key={s} className={cn("w-12 h-12 animate-bounce-in", s <= done.stars ? "fill-secondary text-secondary" : "text-muted")} style={{ animationDelay: `${s * 0.15}s` }} />
      ))}
    </div>
    <div className="candy-card !py-3 !px-6 font-display text-xl">
      +{done.earnedXp ?? lesson.xp_reward} XP
    </div>
    {done.leveledUp && <p className="text-2xl font-display text-accent">🎉 Level {done.newLevel}!</p>}
    {done.newBadges?.map((b: any) => (
      <div key={b.code} className="candy-card flex items-center gap-2 animate-bounce-in">
        <span className="text-3xl">{b.icon}</span>
        <span className="font-bold">New badge: {b.title}</span>
      </div>
    ))}
    <CandyButton onClick={onContinue} variant="success" fullWidth>Continue</CandyButton>
  </div>
);

export default LessonPlayer;
