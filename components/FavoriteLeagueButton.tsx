"use client";

import { useEffect, useState } from "react";
import {
  isFavoriteLeague,
  toggleFavoriteLeague,
  type FavoriteLeague,
} from "@/lib/favorites";

type Props = {
  league: FavoriteLeague;
};

export default function FavoriteLeagueButton({ league }: Props) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteLeague(league.id));

    const refresh = () => {
      setFavorite(isFavoriteLeague(league.id));
    };

    window.addEventListener("goallive-favorites-changed", refresh);

    return () =>
      window.removeEventListener(
        "goallive-favorites-changed",
        refresh
      );
  }, [league.id]);

  function handleClick() {
    const next = toggleFavoriteLeague(league);
    setFavorite(next);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorite ? "Unfollow league" : "Follow league"}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
        favorite
          ? "bg-yellow-400 text-slate-950"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {favorite ? "⭐ Following" : "☆ Follow"}
    </button>
  );
}
