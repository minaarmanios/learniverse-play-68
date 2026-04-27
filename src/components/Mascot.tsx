import hootDefault from "@/assets/hoot.png";
import hootCheer from "@/assets/hoot-cheer.png";
import hootThink from "@/assets/hoot-think.png";

type Mood = "happy" | "cheer" | "think";

interface Props {
  mood?: Mood;
  size?: number;
  className?: string;
  float?: boolean;
}

const map: Record<Mood, string> = {
  happy: hootDefault,
  cheer: hootCheer,
  think: hootThink,
};

export const Mascot = ({ mood = "happy", size = 120, className = "", float = false }: Props) => (
  <img
    src={map[mood]}
    alt="Hoot the owl mascot"
    width={size}
    height={size}
    style={{ width: size, height: size }}
    className={`${float ? "animate-float" : ""} ${className}`}
    draggable={false}
  />
);
