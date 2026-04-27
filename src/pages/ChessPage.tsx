import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, Square } from "chess.js";
import { CandyButton } from "@/components/CandyButton";
import { Mascot } from "@/components/Mascot";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Difficulty = "beginner" | "easy" | "friendly";

const PIECE: Record<string, string> = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

// Simple piece values for evaluation
const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const evaluate = (g: Chess) => {
  let s = 0;
  for (const row of g.board()) for (const sq of row) {
    if (!sq) continue;
    const v = VAL[sq.type];
    s += sq.color === "w" ? v : -v;
  }
  return s;
};

// Pick a move for black (bot). Difficulty controls depth & noise.
const pickBotMove = (g: Chess, diff: Difficulty) => {
  const moves = g.moves({ verbose: true });
  if (!moves.length) return null;

  if (diff === "beginner") {
    // 70% random, 30% best capture if available
    const captures = moves.filter((m) => m.captured);
    if (Math.random() < 0.3 && captures.length) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // 1-ply / 2-ply minimax
  const depth = diff === "easy" ? 1 : 2;
  let best: any = null, bestScore = Infinity;

  const minimax = (game: Chess, d: number, maximizing: boolean): number => {
    if (d === 0 || game.isGameOver()) return evaluate(game);
    const ms = game.moves({ verbose: true });
    if (maximizing) {
      let best = -Infinity;
      for (const m of ms) {
        game.move(m);
        best = Math.max(best, minimax(game, d - 1, false));
        game.undo();
      }
      return best;
    } else {
      let best = Infinity;
      for (const m of ms) {
        game.move(m);
        best = Math.min(best, minimax(game, d - 1, true));
        game.undo();
      }
      return best;
    }
  };

  for (const m of moves) {
    g.move(m);
    const s = minimax(g, depth - 1, true);
    g.undo();
    if (s < bestScore) { bestScore = s; best = m; }
  }
  // friendly mode: 20% blunder by picking random
  if (diff === "friendly" && Math.random() < 0.2) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  return best ?? moves[0];
};

const FILES = ["a","b","c","d","e","f","g","h"];

const ChessPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [diff, setDiff] = useState<Difficulty>("beginner");
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [, force] = useState(0);
  const tick = () => force((x) => x + 1);
  const lastResultLogged = useRef(false);

  const { data: progress } = useQuery({
    queryKey: ["chess_progress", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("chess_progress").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (progress?.current_difficulty) setDiff(progress.current_difficulty as Difficulty);
  }, [progress?.current_difficulty]);

  const board = useMemo(() => {
    const rows = [];
    for (let r = 8; r >= 1; r--) {
      const row = [];
      for (let f = 0; f < 8; f++) {
        const sq = (FILES[f] + r) as Square;
        row.push(sq);
      }
      rows.push(row);
    }
    return rows;
  }, []);

  const legalFromSelected = useMemo(() => {
    if (!selected) return new Set<string>();
    const moves = game.moves({ square: selected, verbose: true });
    return new Set(moves.map((m: any) => m.to));
  }, [selected, game]);

  const onSquare = (sq: Square) => {
    if (game.isGameOver() || game.turn() !== "w") return;
    const piece = game.get(sq);
    if (selected) {
      if (legalFromSelected.has(sq)) {
        const newGame = new Chess(game.fen());
        const move = newGame.move({ from: selected, to: sq, promotion: "q" });
        if (move) {
          setGame(newGame);
          setSelected(null);
          // bot reply
          if (!newGame.isGameOver()) {
            setTimeout(() => {
              const bg = new Chess(newGame.fen());
              const bm = pickBotMove(bg, diff);
              if (bm) {
                bg.move(bm);
                setGame(bg);
                tick();
              }
            }, 350);
          }
          return;
        }
      }
      if (piece && piece.color === "w") setSelected(sq); else setSelected(null);
    } else if (piece && piece.color === "w") {
      setSelected(sq);
    }
  };

  const result = game.isGameOver() ? (
    game.isCheckmate() ? (game.turn() === "b" ? "win" : "lose") : "draw"
  ) : null;

  useEffect(() => {
    if (!result || !user || lastResultLogged.current) return;
    lastResultLogged.current = true;
    (async () => {
      const cur = (await supabase.from("chess_progress").select("*").eq("user_id", user.id).maybeSingle()).data;
      const wins = (cur?.ai_wins ?? 0) + (result === "win" ? 1 : 0);
      const losses = (cur?.ai_losses ?? 0) + (result === "lose" ? 1 : 0);
      await supabase.from("chess_progress").upsert({
        user_id: user.id, ai_wins: wins, ai_losses: losses,
        current_difficulty: diff,
        puzzles_solved: cur?.puzzles_solved ?? 0,
      });
      // award first-win badge
      if (result === "win") {
        const { data: badge } = await supabase.from("badges").select("*").eq("code", "chess_first_win").single();
        if (badge) await supabase.from("user_badges").upsert({ user_id: user.id, badge_id: badge.id });
        toast.success("You won! 🏆");
      }
      qc.invalidateQueries();
    })();
  }, [result, user, diff, qc]);

  const reset = () => {
    setGame(new Chess());
    setSelected(null);
    lastResultLogged.current = false;
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="candy-card bg-gradient-candy text-white flex items-center gap-3 !p-4">
        <Mascot mood="think" size={70} />
        <div className="flex-1">
          <p className="font-display text-xl leading-tight">Play Chess!</p>
          <p className="text-sm opacity-95">You're white. Tap a piece, then tap where to move.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["beginner","easy","friendly"] as const).map((d) => (
          <button
            key={d}
            onClick={() => { setDiff(d); reset(); }}
            className={cn("flex-1 py-2 rounded-2xl font-bold capitalize text-sm",
              diff === d ? "bg-primary text-primary-foreground shadow-btn" : "bg-muted")}
          >{d}</button>
        ))}
      </div>

      <div className="aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-card">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {board.flat().map((sq, i) => {
            const r = Math.floor(i / 8), f = i % 8;
            const dark = (r + f) % 2 === 1;
            const piece = game.get(sq);
            const isSel = selected === sq;
            const canMove = legalFromSelected.has(sq);
            return (
              <button
                key={sq}
                onClick={() => onSquare(sq)}
                className={cn(
                  "flex items-center justify-center text-3xl sm:text-4xl relative transition-colors",
                  dark ? "bg-[hsl(200,30%,55%)]" : "bg-[hsl(45,90%,90%)]",
                  isSel && "ring-4 ring-secondary ring-inset",
                )}
              >
                {piece && (
                  <span className={piece.color === "w" ? "text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]" : "text-black"}>
                    {PIECE[piece.color === "w" ? piece.type.toUpperCase() : piece.type]}
                  </span>
                )}
                {canMove && !piece && <span className="w-3 h-3 rounded-full bg-success/70" />}
                {canMove && piece && <span className="absolute inset-1 rounded ring-4 ring-success/70" />}
              </button>
            );
          })}
        </div>
      </div>

      {result && (
        <div className="candy-card text-center animate-bounce-in">
          <p className="text-2xl font-display">
            {result === "win" ? "🏆 You won!" : result === "lose" ? "Good game! 💪" : "It's a draw!"}
          </p>
          <CandyButton variant="success" fullWidth className="mt-3" onClick={reset}>Play again</CandyButton>
        </div>
      )}

      {!result && (
        <CandyButton variant="coral" fullWidth onClick={reset}>Restart</CandyButton>
      )}

      <div className="candy-card text-sm text-center">
        <p className="font-bold">
          ♟ Wins: {progress?.ai_wins ?? 0} • Losses: {progress?.ai_losses ?? 0}
        </p>
      </div>
    </div>
  );
};

export default ChessPage;
