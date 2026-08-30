"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  liveCount?: number;
  favoriteCount?: number;
};

export default function BottomNav({
  liveCount = 0,
  favoriteCount = 0,
}: Props) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/?tab=Live", label: "Live", icon: "🔴", badge: liveCount },
    { href: "/favorites", label: "Favorites", icon: "⭐", badge: favoriteCount },
    { href: "/?tab=Leagues", label: "Leagues", icon: "🏆" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" && !item.href.includes("tab=")
              : pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                active
                  ? "text-green-400"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>

              {!!item.badge && item.badge > 0 && (
                <span className="absolute right-[24%] top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
