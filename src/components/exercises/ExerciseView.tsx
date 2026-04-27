import { useState } from "react";
import type { Exercise } from "@/hooks/useLessons";
import { CandyButton } from "@/components/CandyButton";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import { toast } from "sonner";

interface Props {
  exercise: Exercise;
  onAnswer: (correct: boolean) => void;
}

export const ExerciseView = ({ exercise, onAnswer }: Props) => {
  switch (exercise.type) {
    case "choice": return <ChoiceEx ex={exercise} onAnswer={onAnswer} />;
    case "match": return <MatchEx ex={exercise} onAnswer={onAnswer} />;
    case "fill": return <ChoiceEx ex={exercise} onAnswer={onAnswer} />;
    case "build": return <BuildEx ex={exercise} onAnswer={onAnswer} />;
    case "count": return <CountEx ex={exercise} onAnswer={onAnswer} />;
    case "input": return <InputEx ex={exercise} onAnswer={onAnswer} />;
    case "speak": return <SpeakEx ex={exercise} onAnswer={onAnswer} />;
    default: return null;
  }
};

// ---- Submit bar shared ----
const Submit = ({ disabled, onClick, label = "Check" }: any) => (
  <CandyButton onClick={onClick} disabled={disabled} variant="success" fullWidth>
    {label}
  </CandyButton>
);

// ---- Multiple choice + Fill blank ----
const ChoiceEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const submit = () => onAnswer(picked === ex.correct);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display text-center">{ex.prompt}</h2>
      <div className="grid grid-cols-1 gap-3">
        {ex.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={cn(
              "candy-card text-left text-lg font-bold press-down",
              picked === i && "ring-4 ring-primary"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <Submit disabled={picked === null} onClick={submit} />
    </div>
  );
};

// ---- Match pairs ----
const MatchEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const pairs = ex.pairs ?? [];
  const [aSel, setASel] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [shuffleB] = useState(() => [...pairs].sort(() => Math.random() - 0.5));

  const onA = (i: number) => {
    if (matched.has(`a${i}`)) return;
    setASel(i);
  };
  const onB = (i: number) => {
    if (aSel === null || matched.has(`b${i}`)) return;
    if (pairs[aSel].b === shuffleB[i].b) {
      const next = new Set(matched);
      next.add(`a${aSel}`); next.add(`b${i}`);
      setMatched(next);
      setASel(null);
      if (next.size === pairs.length * 2) {
        setTimeout(() => onAnswer(true), 400);
      }
    } else {
      setASel(null);
      toast("Try again!", { duration: 800 });
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display text-center">{ex.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <button
              key={i}
              onClick={() => onA(i)}
              disabled={matched.has(`a${i}`)}
              className={cn("candy-card w-full text-2xl !py-3", aSel === i && "ring-4 ring-primary",
                matched.has(`a${i}`) && "opacity-30")}
            >{p.a}</button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffleB.map((p, i) => (
            <button
              key={i}
              onClick={() => onB(i)}
              disabled={matched.has(`b${i}`)}
              className={cn("candy-card w-full font-bold !py-3", matched.has(`b${i}`) && "opacity-30")}
            >{p.b}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---- Build sentence ----
const BuildEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const [bank] = useState(() => [...(ex.words ?? [])].sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useState<number[]>([]);
  const pick = (i: number) => !picked.includes(i) && setPicked([...picked, i]);
  const unpick = (idx: number) => setPicked(picked.filter((_, j) => j !== idx));
  const answer = (ex.answer as string[]) ?? [];
  const submit = () => {
    const built = picked.map((i) => bank[i]);
    onAnswer(built.join(" ") === answer.join(" "));
  };
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display text-center">{ex.prompt}</h2>
      <div className="candy-card min-h-20 flex flex-wrap gap-2">
        {picked.map((i, idx) => (
          <button key={idx} onClick={() => unpick(idx)} className="bg-primary text-primary-foreground px-3 py-2 rounded-xl font-bold">
            {bank[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {bank.map((w, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={picked.includes(i)}
            className={cn("bg-card px-3 py-2 rounded-xl font-bold shadow-card press-down",
              picked.includes(i) && "opacity-30")}
          >
            {w}
          </button>
        ))}
      </div>
      <Submit disabled={picked.length !== bank.length} onClick={submit} />
    </div>
  );
};

// ---- Count ----
const CountEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-display text-center">{ex.prompt}</h2>
      <div className="candy-card text-center">
        <div className="text-5xl flex flex-wrap justify-center gap-1">
          {Array.from({ length: ex.count ?? 0 }).map((_, i) => (
            <span key={i}>{ex.emoji}</span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(ex.options as number[])?.map((n, i) => (
          <button
            key={i}
            onClick={() => setPicked(n)}
            className={cn("candy-card text-3xl font-display press-down !py-5",
              picked === n && "ring-4 ring-primary")}
          >{n}</button>
        ))}
      </div>
      <Submit disabled={picked === null} onClick={() => onAnswer(picked === ex.count)} />
    </div>
  );
};

// ---- Number input ----
const InputEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const [val, setVal] = useState("");
  const tap = (n: string) => setVal((v) => (v.length < 4 ? v + n : v));
  const back = () => setVal((v) => v.slice(0, -1));
  const submit = () => onAnswer(Number(val) === ex.answer);
  return (
    <div className="space-y-5">
      <h2 className="text-3xl font-display text-center">{ex.prompt}</h2>
      <div className="candy-card text-center text-5xl font-display min-h-24 flex items-center justify-center">
        {val || <span className="text-muted-foreground">_</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9"].map((n) => (
          <button key={n} onClick={() => tap(n)} className="candy-card text-3xl font-display !py-5 press-down">{n}</button>
        ))}
        <button onClick={back} className="candy-card text-2xl !py-5 press-down">⌫</button>
        <button onClick={() => tap("0")} className="candy-card text-3xl font-display !py-5 press-down">0</button>
        <div />
      </div>
      <Submit disabled={!val} onClick={submit} />
    </div>
  );
};

// ---- Speak (TTS + speech recognition) ----
const SpeakEx = ({ ex, onAnswer }: { ex: Exercise; onAnswer: (c: boolean) => void }) => {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");

  const playTTS = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(ex.word ?? "");
    u.rate = 0.85;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  };

  const startListen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast("Voice not supported on this device", { duration: 1500 });
      onAnswer(true); // be kind: mark right
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    setListening(true);
    rec.onresult = (e: any) => {
      const results: string[] = [];
      for (let i = 0; i < e.results[0].length; i++) results.push(e.results[0][i].transcript);
      const said = results.join(" ").toLowerCase();
      setHeard(results[0]);
      const target = (ex.word ?? "").toLowerCase();
      const ok = results.some((r) => r.toLowerCase().includes(target)) || said.includes(target);
      setListening(false);
      onAnswer(ok);
    };
    rec.onerror = () => { setListening(false); toast("Couldn't hear that, try again!"); };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="space-y-5 text-center">
      <h2 className="text-2xl font-display">{ex.prompt}</h2>
      <div className="candy-card !py-10 text-4xl font-display">{ex.word?.toUpperCase()}</div>
      <CandyButton onClick={playTTS} variant="secondary" fullWidth>🔊 Hear it</CandyButton>
      <button
        onClick={startListen}
        disabled={listening}
        className={cn(
          "w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white shadow-btn-coral press-down",
          listening ? "bg-coral animate-pulse" : "bg-coral"
        )}
      >
        <Mic className="w-14 h-14" />
      </button>
      <p className="text-sm text-muted-foreground">{listening ? "Listening..." : heard ? `Heard: "${heard}"` : "Tap the mic and say the word!"}</p>
    </div>
  );
};
