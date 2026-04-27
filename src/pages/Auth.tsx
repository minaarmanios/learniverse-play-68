import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CandyButton } from "@/components/CandyButton";
import { Mascot } from "@/components/Mascot";
import { toast } from "sonner";

const Auth = () => {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ageBand, setAgeBand] = useState<"5-7" | "8-10" | "11-12">("5-7");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || "Friend" },
          },
        });
        if (error) throw error;
        if (data.user) {
          // update profile defaults
          await supabase.from("profiles").update({
            display_name: name || "Friend",
            age_band: ageBand,
          }).eq("id", data.user.id);
        }
        toast.success(`Welcome, ${name || "friend"}! 🎉`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 👋");
      }
      nav("/");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Mascot mood="cheer" size={140} float />
          <h1 className="text-4xl mt-2">KidLearn</h1>
          <p className="text-muted-foreground mt-1 font-semibold">
            {mode === "signup" ? "Let's get started!" : "Welcome back!"}
          </p>
        </div>

        <form onSubmit={submit} className="candy-card space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-bold mb-1.5 ml-1">Your name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  className="w-full text-lg bg-muted rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5 ml-1">How old are you?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["5-7", "8-10", "11-12"] as const).map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setAgeBand(b)}
                      className={`rounded-2xl py-3 font-bold ${
                        ageBand === b ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full text-lg bg-muted rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full text-lg bg-muted rounded-2xl px-4 py-3 pr-16 outline-none focus:ring-2 ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <CandyButton type="submit" fullWidth disabled={loading}>
            {loading ? "..." : mode === "signup" ? "Start learning" : "Log in"}
          </CandyButton>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-center font-semibold text-primary"
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
