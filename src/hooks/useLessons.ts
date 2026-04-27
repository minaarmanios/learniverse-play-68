import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ExerciseType = "choice" | "match" | "fill" | "build" | "count" | "input" | "speak";

export interface Exercise {
  type: ExerciseType;
  prompt: string;
  options?: (string | number)[];
  correct?: number;
  pairs?: { a: string; b: string }[];
  words?: string[];
  answer?: string[] | number;
  emoji?: string;
  count?: number;
  word?: string;
}

export interface Lesson {
  id: string;
  subject: "english" | "math";
  order_index: number;
  title: string;
  description: string | null;
  age_band: string;
  difficulty: number;
  xp_reward: number;
  content: { exercises: Exercise[] };
}

export const useLessons = () => {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("subject")
        .order("order_index");
      if (error) throw error;
      return data as unknown as Lesson[];
    },
  });
};

export const useLesson = (id: string | undefined) => {
  return useQuery({
    queryKey: ["lesson", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as Lesson;
    },
  });
};

export const useLessonProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lesson_progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });
};
