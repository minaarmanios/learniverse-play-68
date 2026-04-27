import { NavLink } from "react-router-dom";
import { Home, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Learn", icon: Home },
  { to: "/chess", label: "Chess", icon: Crown },
  { to: "/profile", label: "Me", icon: User },
];

export const BottomNav = () => (
  <nav className="sticky bottom-0 z-30 bg-card/95 backdrop-blur border-t border-border">
    <div className="max-w-md mx-auto flex">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-3 font-display font-semibold text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("w-6 h-6", isActive && "animate-pop")} strokeWidth={2.5} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
