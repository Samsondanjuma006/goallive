"use client";

import { useEffect, useState } from "react";
import {
  loadFavorites,
  saveFavorites,
  type FavoriteTeam,
} from "@/app/lib/favorites";

type Props = {
  team: FavoriteTeam;
};

export default function FavoriteButton({ team }: Props) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const state = loadFavorites();
    setFavorite(state.teams.some((item) => item.id === team.id));
  }, [team.id]);

  function toggle() {
    const state = loadFavorites();

    const exists = state.teams.some((item) => item.id === team.id);

    const teams = exists
      ? state.teams.filter((item) => item.id !== team.id)
      : [...state.teams, team];

    saveFavorites({
      ...state,
      teams,
    });

    setFavorite(!exists);

    window.dispatchEvent(new Event("goallive-favorites-changed"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorite ? `Remove ${team.name}` : `Favorite ${team.name}`}
      className="rounded-xl bg-slate-800 px-4 py-2 text-xl transition hover:bg-slate-700"
    >
      {favorite ? "⭐" : "☆"}
    </button>
  );
}
