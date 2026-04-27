import { supabase } from "@/integrations/supabase/client";

const todayStr = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a: string, b: string) => {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86400000);
};

interface Args {
  userId: string;
  lessonId: string;
  stars: number;
  score: number;
  xpReward: number;
}

export const completeLesson = async ({ userId, lessonId, stars, score, xpReward }: Args) => {
  // upsert progress (best score wins)
  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const isFirst = !existing;
  if (existing) {
    if (score > (existing.score ?? 0)) {
      await supabase
        .from("lesson_progress")
        .update({ stars, score, completed_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  } else {
    await supabase.from("lesson_progress").insert({
      user_id: userId,
      lesson_id: lessonId,
      stars,
      score,
    });
  }

  // update profile XP, coins, streak
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (!profile) return { isFirst, leveledUp: false, newBadges: [] };

  const today = todayStr();
  let newStreak = profile.current_streak;
  if (profile.last_active_date) {
    const diff = daysBetween(profile.last_active_date, today);
    if (diff === 0) newStreak = profile.current_streak;
    else if (diff === 1) newStreak = profile.current_streak + 1;
    else newStreak = 1;
  } else {
    newStreak = 1;
  }
  const earnedXp = isFirst ? xpReward : Math.floor(xpReward / 2);
  const newXp = profile.xp + earnedXp;
  const oldLevel = profile.level;
  // simple: every 100 xp = level up
  const newLevel = Math.max(1, Math.floor(newXp / 100) + 1);
  const newCoins = profile.coins + (isFirst ? 5 : 2);

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      coins: newCoins,
      current_streak: newStreak,
      longest_streak: Math.max(profile.longest_streak, newStreak),
      last_active_date: today,
    })
    .eq("id", userId);

  // Award badges
  const { data: allBadges } = await supabase.from("badges").select("*");
  const { data: ownedBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId);
  const owned = new Set((ownedBadges ?? []).map((b) => b.badge_id));
  const newBadges: { code: string; title: string; icon: string }[] = [];

  const tryAward = async (code: string) => {
    const b = (allBadges ?? []).find((x) => x.code === code);
    if (!b || owned.has(b.id)) return;
    await supabase.from("user_badges").insert({ user_id: userId, badge_id: b.id });
    newBadges.push({ code: b.code, title: b.title, icon: b.icon });
  };

  if (isFirst) await tryAward("first_lesson");
  if (newStreak >= 3) await tryAward("streak_3");
  if (newStreak >= 7) await tryAward("streak_7");
  if (newXp >= 100) await tryAward("xp_100");
  if (newXp >= 500) await tryAward("xp_500");

  // subject badges
  const { data: progressList } = await supabase
    .from("lesson_progress")
    .select("lesson_id, lessons(subject)")
    .eq("user_id", userId);
  const englishCount = (progressList ?? []).filter((p: any) => p.lessons?.subject === "english").length;
  const mathCount = (progressList ?? []).filter((p: any) => p.lessons?.subject === "math").length;
  if (englishCount >= 3) await tryAward("english_starter");
  if (mathCount >= 3) await tryAward("math_starter");

  return {
    isFirst,
    earnedXp,
    leveledUp: newLevel > oldLevel,
    newLevel,
    newBadges,
  };
};
