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

const TEAMS_KEY = "goallive_favorite_teams";
const LEAGUES_KEY = "goallive_favorite_leagues";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("goallive-favorites-changed"));
}

export function getFavoriteTeams(): FavoriteTeam[] {
  return read<FavoriteTeam>(TEAMS_KEY);
}

export function getFavoriteLeagues(): FavoriteLeague[] {
  return read<FavoriteLeague>(LEAGUES_KEY);
}

export function isFavoriteTeam(id: number) {
  return getFavoriteTeams().some((team) => team.id === id);
}

export function isFavoriteLeague(id: number) {
  return getFavoriteLeagues().some((league) => league.id === id);
}

export function toggleFavoriteTeam(team: FavoriteTeam) {
  const current = getFavoriteTeams();

  const exists = current.some((item) => item.id === team.id);

  const next = exists
    ? current.filter((item) => item.id !== team.id)
    : [...current, team];

  write(TEAMS_KEY, next);

  return !exists;
}

export function toggleFavoriteLeague(league: FavoriteLeague) {
  const current = getFavoriteLeagues();

  const exists = current.some((item) => item.id === league.id);

  const next = exists
    ? current.filter((item) => item.id !== league.id)
    : [...current, league];

  write(LEAGUES_KEY, next);

  return !exists;
}
