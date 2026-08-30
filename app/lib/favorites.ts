export type FavoriteTeam = {
  id: number;
  name: string;
  logo?: string;
};

export type FavoriteLeague = {
  id: number;
  name: string;
  logo?: string;
};

export type FavoritesState = {
  teams: FavoriteTeam[];
  leagues: FavoriteLeague[];
};

const STORAGE_KEY = "goallive-favorites-v1";

export function loadFavorites(): FavoritesState {
  if (typeof window === "undefined") {
    return { teams: [], leagues: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { teams: [], leagues: [] };

    const parsed = JSON.parse(raw);

    return {
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
      leagues: Array.isArray(parsed.leagues) ? parsed.leagues : [],
    };
  } catch {
    return { teams: [], leagues: [] };
  }
}

export function saveFavorites(state: FavoritesState) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
