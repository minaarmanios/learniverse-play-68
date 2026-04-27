import { Flame, Coins, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export const TopBar = () => {
  const { data: profile } = useProfile();
  if (!profile) return <div className="h-16" />;
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border/60">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="w-9 h-9 rounded-full bg-gradient-sky flex items-center justify-center text-white text-base shadow-btn">
            {profile.display_name.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{profile.display_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <Stat icon={<Zap className="w-4 h-4 text-primary" fill="currentColor" />} value={profile.xp} label="XP" />
          <Stat icon={<Flame className="w-4 h-4 text-coral" fill="currentColor" />} value={profile.current_streak} />
          <Stat icon={<Coins className="w-4 h-4 text-secondary" fill="currentColor" />} value={profile.coins} />
        </div>
      </div>
    </header>
  );
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: number; label?: string }) => (
  <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-1.5">
    {icon}
    <span>{value}</span>
    {label && <span className="text-muted-foreground ml-0.5">{label}</span>}
  </div>
);
