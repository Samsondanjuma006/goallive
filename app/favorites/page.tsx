"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FavoriteButton from "@/app/components/FavoriteButton";
import {
  loadFavorites,
  type FavoritesState,
} from "@/app/lib/favorites";

type Match = {
  id: number;
  leagueId: number;
  league: string;
  leagueLogo?: string;
  homeId: number;
  home: string;
  homeLogo?: string;
  awayId: number;
  away: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  status: "LIVE" | "UPCOMING" | "FT";
  time: string;
  statusLong?: string;
};

type FavoriteTeam = {
  id: number;
  name: string;
  logo?: string;
};

type FavoriteLeague = {
  id: number;
  name: string;
  logo?: string;
};

function normalizeMatches(data: any): Match[] {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.response)
      ? data.response
      : Array.isArray(data?.matches)
        ? data.matches
        : [];

  return rows.map((item: any) => {
    const fixture = item.fixture ?? item;
    const league = item.league ?? {};
    const teams = item.teams ?? {};
    const goals = item.goals ?? {};
    const status = fixture.status ?? {};
    const short = status.short;

    let normalizedStatus: Match["status"] = "UPCOMING";

    if (
      ["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(
        short
      )
    ) {
      normalizedStatus = "LIVE";
    } else if (["FT", "AET", "PEN"].includes(short)) {
      normalizedStatus = "FT";
    }

    let time = "Upcoming";

    if (normalizedStatus === "LIVE") {
      time =
        short === "HT"
          ? "HT"
          : status.elapsed != null
            ? `${status.elapsed}'`
            : "LIVE";
    } else if (normalizedStatus === "FT") {
      time = "FT";
    } else if (fixture.date) {
      time = new Date(fixture.date).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return {
      id: Number(fixture.id ?? 0),
      leagueId: Number(league.id ?? 0),
      league: league.name ?? "Unknown League",
      leagueLogo: league.logo,
      homeId: Number(teams.home?.id ?? 0),
      home: teams.home?.name ?? "Home",
      homeLogo: teams.home?.logo,
      awayId: Number(teams.away?.id ?? 0),
      away: teams.away?.name ?? "Away",
      awayLogo: teams.away?.logo,
      homeScore: Number(goals.home ?? 0),
      awayScore: Number(goals.away ?? 0),
      status: normalizedStatus,
      time,
      statusLong: status.long,
    };
  });
}

function FavoriteTeamRow({
  team,
  onRemove,
}: {
  team: FavoriteTeam;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <Link
        href={`/team/${team.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {team.logo ? (
          <img
            src={team.logo}
            alt=""
            className="h-10 w-10 object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
            ⚽
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate font-bold">
            {team.name}
          </div>
          <div className="text-xs text-slate-500">
            Team
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950 hover:text-red-300"
      >
        Remove
      </button>
    </div>
  );
}

function FavoriteLeagueRow({
  league,
  onRemove,
}: {
  league: FavoriteLeague;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <Link
        href={`/league/${league.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        {league.logo ? (
          <img
            src={league.logo}
            alt=""
            className="h-10 w-10 object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
            🏆
          </div>
        )}

        <div className="min-w-0">
          <div className="truncate font-bold">
            {league.name}
          </div>
          <div className="text-xs text-slate-500">
            Competition
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950 hover:text-red-300"
      >
        Remove
      </button>
    </div>
  );
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritesState>({
    teams: [],
    leagues: [],
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "teams" | "leagues"
  >("all");

  function refreshFavorites() {
    setFavorites(loadFavorites());
  }

  async function loadMatches() {
    try {
      const response = await fetch("/api/live", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();
      setMatches(normalizeMatches(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshFavorites();
    loadMatches();

    const timer = setInterval(loadMatches, 30000);

    window.addEventListener(
      "goallive-favorites-changed",
      refreshFavorites
    );

    return () => {
      clearInterval(timer);

      window.removeEventListener(
        "goallive-favorites-changed",
        refreshFavorites
      );
    };
  }, []);

  const favoriteMatches = useMemo(() => {
    const teamIds = new Set(
      favorites.teams.map((team) => Number(team.id))
    );

    const leagueIds = new Set(
      favorites.leagues.map((league) => Number(league.id))
    );

    return matches.filter(
      (match) =>
        teamIds.has(match.homeId) ||
        teamIds.has(match.awayId) ||
        leagueIds.has(match.leagueId)
    );
  }, [matches, favorites]);

  function removeTeam(id: number) {
    const next = {
      ...favorites,
      teams: favorites.teams.filter(
        (team) => Number(team.id) !== id
      ),
    };

    localStorage.setItem(
      "goallive-favorites",
      JSON.stringify(next)
    );

    setFavorites(next);

    window.dispatchEvent(
      new Event("goallive-favorites-changed")
    );
  }

  function removeLeague(id: number) {
    const next = {
      ...favorites,
      leagues: favorites.leagues.filter(
        (league) => Number(league.id) !== id
      ),
    };

    localStorage.setItem(
      "goallive-favorites",
      JSON.stringify(next)
    );

    setFavorites(next);

    window.dispatchEvent(
      new Event("goallive-favorites-changed")
    );
  }

  const hasFavorites =
    favorites.teams.length > 0 ||
    favorites.leagues.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 pb-20 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link
                href="/"
                className="text-2xl font-black"
              >
                ⚽ Goal<span className="text-green-400">Live</span>
              </Link>

              <p className="mt-1 text-xs text-slate-500">
                Your personalized football feed
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold hover:bg-slate-800"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">
            ⭐ My Favorites
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Follow your favorite teams and competitions.
          </p>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          {[
            ["all", "Everything"],
            ["teams", "Teams"],
            ["leagues", "Leagues"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveFilter(
                  value as "all" | "teams" | "leagues"
                )
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                activeFilter === value
                  ? "bg-green-500 text-slate-950"
                  : "bg-slate-900 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {!hasFavorites ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-5xl">⭐</div>

            <h2 className="mt-4 text-lg font-bold">
              No favorites yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Open a match, team or league and tap the
              star to add it to your favorites.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-green-400"
            >
              Browse GoalLive
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {(activeFilter === "all" ||
              activeFilter === "teams") &&
              favorites.teams.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-bold">
                      👕 Favorite Teams
                    </h2>

                    <span className="text-xs text-slate-500">
                      {favorites.teams.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {favorites.teams.map((team) => (
                      <FavoriteTeamRow
                        key={team.id}
                        team={team}
                        onRemove={() =>
                          removeTeam(Number(team.id))
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

            {(activeFilter === "all" ||
              activeFilter === "leagues") &&
              favorites.leagues.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-bold">
                      🏆 Favorite Competitions
                    </h2>

                    <span className="text-xs text-slate-500">
                      {favorites.leagues.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {favorites.leagues.map((league) => (
                      <FavoriteLeagueRow
                        key={league.id}
                        league={league}
                        onRemove={() =>
                          removeLeague(Number(league.id))
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

            {activeFilter === "all" &&
              hasFavorites &&
              !loading && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold">
                        🔴 Your Matches
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Matches connected to your favorites
                      </p>
                    </div>

                    <span className="text-xs text-slate-500">
                      {favoriteMatches.length}
                    </span>
                  </div>

                  {favoriteMatches.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                      <div className="text-3xl">⚽</div>

                      <p className="mt-3 text-sm font-semibold">
                        No matching fixtures right now
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        We'll show them here when they appear
                        in the live feed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favoriteMatches.map((match) => (
                        <Link
                          key={match.id}
                          href={`/match/${match.id}`}
                          className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-xs text-slate-500">
                              {match.league}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                match.status === "LIVE"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {match.status === "LIVE"
                                ? `🔴 ${match.time}`
                                : match.time}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="text-right font-bold">
                              {match.home}
                            </div>

                            <div className="text-center text-xl font-black">
                              {match.homeScore} -{" "}
                              {match.awayScore}
                            </div>

                            <div className="font-bold">
                              {match.away}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )}
          </div>
        )}
      </section>
    </main>
  );
}
