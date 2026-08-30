"use client";

import { useEffect, useState } from "react";
import {
  isFavoriteTeam,
  toggleFavoriteTeam,
  type FavoriteTeam,
} from "@/lib/favorites";

type Props = {
  team: FavoriteTeam;
};

export default function FavoriteTeamButton({ team }: Props) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavoriteTeam(team.id));

    const refresh = () => {
      setFavorite(isFavoriteTeam(team.id));
    };

    window.addEventListener("goallive-favorites-changed", refresh);

    return () =>
      window.removeEventListener(
        "goallive-favorites-changed",
        refresh
      );
  }, [team.id]);

  function handleClick() {
    const next = toggleFavoriteTeam(team);
    setFavorite(next);
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorite ? "Remove favorite" : "Add favorite"}
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
