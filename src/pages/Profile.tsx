import { useEffect, useState } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Mascot } from "@/components/Mascot";
import { CandyButton } from "@/components/CandyButton";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Zap, Coins, Star, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const update = useUpdateProfile();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (profile?.display_name) setName(profile.display_name); }, [profile?.display_name]);

  const { data: badges = [] } = useQuery({
    queryKey: ["all_badges"],
    queryFn: async () => (await supabase.from("badges").select("*").order("code")).data ?? [],
  });
  const { data: earned = [] } = useQuery({
    queryKey: ["earned_badges", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_badges").select("badge_id").eq("user_id", user!.id)).data ?? [],
  });
  const { data: lessonCount = 0 } = useQuery({
    queryKey: ["lesson_count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const earnedSet = new Set(earned.map((e) => e.badge_id));

  if (!profile) return null;

  return (
    <div className="space-y-5 pb-4">
      <div className="candy-card text-center bg-gradient-candy text-white">
        <Mascot mood="happy" size={100} />
        {editing ? (
          <div className="space-y-3 mt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/20 text-white placeholder-white/70 text-center text-2xl font-display rounded-2xl px-4 py-2 outline-none w-full"
            />
            <div className="flex gap-2 justify-center">
              <CandyButton variant="success" onClick={async () => { await update.mutateAsync({ display_name: name }); setEditing(false); }}>Save</CandyButton>
              <CandyButton variant="coral" onClick={() => setEditing(false)}>Cancel</CandyButton>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl mt-2">{profile.display_name}</h1>
            <p className="text-sm opacity-90">Level {profile.level} • Age {profile.age_band}</p>
            <button onClick={() => setEditing(true)} className="text-sm font-bold underline mt-2">Edit name</button>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Zap className="w-6 h-6 text-primary" fill="currentColor" />} value={profile.xp} label="XP" />
        <Stat icon={<Flame className="w-6 h-6 text-coral" fill="currentColor" />} value={profile.current_streak} label="Streak" />
        <Stat icon={<Coins className="w-6 h-6 text-secondary" fill="currentColor" />} value={profile.coins} label="Coins" />
      </div>

      <div className="candy-card">
        <h2 className="font-display text-xl mb-3">Stats</h2>
        <Row label="Lessons completed" value={lessonCount} />
        <Row label="Longest streak" value={`${profile.longest_streak} days`} />
        <Row label="Badges earned" value={`${earned.length} / ${badges.length}`} />
      </div>

      <div className="candy-card">
        <h2 className="font-display text-xl mb-3">Badges</h2>
        <div className="grid grid-cols-4 gap-3">
          {badges.map((b: any) => {
            const has = earnedSet.has(b.id);
            return (
              <div key={b.id} className={`text-center ${has ? "" : "opacity-30 grayscale"}`} title={b.description}>
                <div className="text-4xl">{b.icon}</div>
                <p className="text-xs font-bold mt-1 leading-tight">{b.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Your progress is saved to your account.</p>

      <CandyButton variant="coral" fullWidth onClick={signOut}>
        <LogOut className="w-5 h-5 inline mr-2" /> Sign out
      </CandyButton>
    </div>
  );
};

const Stat = ({ icon, value, label }: any) => (
  <div className="candy-card text-center !p-3">
    <div className="flex justify-center">{icon}</div>
    <div className="font-display text-2xl mt-1">{value}</div>
    <div className="text-xs text-muted-foreground font-bold">{label}</div>
  </div>
);

const Row = ({ label, value }: any) => (
  <div className="flex justify-between py-1.5 text-sm font-semibold border-b last:border-0 border-border">
    <span className="text-muted-foreground">{label}</span><span>{value}</span>
  </div>
);

export default Profile;
