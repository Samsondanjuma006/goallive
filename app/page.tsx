"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/app/components/BottomNav";
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
  time: string;
  status: "LIVE" | "UPCOMING" | "FT";
  statusLong?: string;
};

type League = {
  id: number;
  name: string;
  logo?: string;
};

const leagueList: League[] = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 2, name: "Champions League" },
  { id: 253, name: "Major League Soccer" },
  { id: 262, name: "Liga MX" },
  { id: 222, name: "NWSL Women" },
];

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
      [
        "1H",
        "2H",
        "HT",
        "ET",
        "BT",
        "P",
        "LIVE",
      ].includes(short)
    ) {
      normalizedStatus = "LIVE";
    } else if (
      [
        "FT",
        "AET",
        "PEN",
      ].includes(short)
    ) {
      normalizedStatus = "FT";
    }

    const elapsed = status.elapsed;

    let time = "Upcoming";

    if (normalizedStatus === "LIVE") {
      time = short === "HT"
        ? "HT"
        : elapsed
          ? `${elapsed}'`
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
      id: Number(fixture.id ?? Math.random()),
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

      time,
      status: normalizedStatus,
      statusLong: status.long,
    };
  });
}

function TeamLink({
  id,
  name,
  logo,
}: {
  id: number;
  name: string;
  logo?: string;
}) {
  return (
    <Link
      href={`/team/${id}`}
      onClick={(event) => event.stopPropagation()}
      className="flex items-center gap-2 font-bold hover:text-green-400"
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          className="h-7 w-7 object-contain"
          loading="lazy"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs">
          ⚽
        </span>
      )}

      <span>{name}</span>
    </Link>
  );
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState("Live");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [favorites, setFavorites] = useState<FavoritesState>({
    teams: [],
    leagues: [],
  });

  async function loadLive() {
    try {
      setError("");

      const response = await fetch("/api/live", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load live matches");
      }

      const data = await response.json();

      setMatches(normalizeMatches(data));
    } catch (err) {
      console.error(err);
      setError("Unable to load live football data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get("tab");

    if (
      requestedTab === "Live" ||
      requestedTab === "Fixtures" ||
      requestedTab === "Results" ||
      requestedTab === "Leagues"
    ) {
      setTab(requestedTab);
    }

    setFavorites(loadFavorites());

    loadLive();

    const timer = setInterval(loadLive, 30000);

    const refreshFavorites = () => {
      setFavorites(loadFavorites());
    };

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

  const filteredMatches = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return matches;
    }

    return matches.filter((match) =>
      `${match.home} ${match.away} ${match.league}`
        .toLowerCase()
        .includes(query)
    );
  }, [matches, search]);

  const visibleMatches = useMemo(() => {
    if (tab === "Live") {
      return filteredMatches.filter(
        (match) => match.status === "LIVE"
      );
    }

    if (tab === "Fixtures") {
      return filteredMatches.filter(
        (match) => match.status === "UPCOMING"
      );
    }

    if (tab === "Results") {
      return filteredMatches.filter(
        (match) => match.status === "FT"
      );
    }

    return filteredMatches;
  }, [filteredMatches, tab]);

  const liveCount = matches.filter(
    (match) => match.status === "LIVE"
  ).length;

  const favoriteCount =
    favorites.teams.length + favorites.leagues.length;

  function changeTab(next: string) {
    setTab(next);

    if (
      next === "Live" ||
      next === "Fixtures" ||
      next === "Results" ||
      next === "Leagues"
    ) {
      window.history.replaceState(
        null,
        "",
        `/?tab=${next}`
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <h1 className="text-2xl font-black tracking-tight">
                ⚽ Goal<span className="text-green-400">Live</span>
              </h1>

              <p className="text-xs text-slate-400">
                Live football scores
              </p>
            </Link>

            <Link
              href="/favorites"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold hover:bg-slate-800"
            >
              ⭐ {favoriteCount}
            </Link>
          </div>

          <div className="mt-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const q = search.trim();

                if (q) {
                  window.location.href = `/search?q=${encodeURIComponent(q)}`;
                }
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams or leagues..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-green-500"
              />
            </form>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {[
            "Live",
            "Fixtures",
            "Results",
            "Leagues",
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeTab(item)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                tab === item
                  ? "bg-green-500 text-slate-950"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {item === "Live" ? "🔴 " : ""}
              {item}
            </button>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {tab === "Leagues" ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                🏆 Competitions
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Follow competitions, fixtures, results and standings
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {leagueList.map((league) => {
                const count = matches.filter(
                  (match) => match.leagueId === league.id
                ).length;

                return (
                  <Link
                    key={league.id}
                    href={`/league/${league.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-green-500 hover:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      {league.logo ? (
                        <img
                          src={league.logo}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <div className="text-3xl">
                          🏆
                        </div>
                      )}

                      <span className="text-xs text-slate-500">
                        {count > 0
                          ? `${count} live`
                          : "View league"}
                      </span>
                    </div>

                    <div className="mt-4 font-bold">
                      {league.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Fixtures · Results · Standings
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {tab === "Live"
                    ? "🔴 Live Matches"
                    : tab === "Fixtures"
                      ? "📅 Upcoming Fixtures"
                      : "✅ Recent Results"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {loading
                    ? "Loading..."
                    : `${visibleMatches.length} match${
                        visibleMatches.length === 1
                          ? ""
                          : "es"
                      }`}
                </p>
              </div>

              <span className="hidden text-xs text-slate-500 sm:block">
                {liveCount} live · Auto refresh 30s
              </span>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                <div className="text-4xl">
                  ⚽
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  Loading football matches...
                </p>
              </div>
            ) : visibleMatches.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                <div className="text-4xl">
                  ⚽
                </div>

                <p className="mt-3 font-semibold">
                  No matches found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try another search or category.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleMatches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/league/${match.leagueId}`}
                        className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-400 hover:text-green-400"
                      >
                        {match.leagueLogo ? (
                          <img
                            src={match.leagueLogo}
                            alt=""
                            className="h-5 w-5 object-contain"
                          />
                        ) : (
                          <span>🏆</span>
                        )}

                        <span className="truncate">
                          {match.league}
                        </span>
                      </Link>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
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

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="text-right">
                        <div className="flex justify-end">
                          <TeamLink
                            id={match.homeId}
                            name={match.home}
                            logo={match.homeLogo}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/match/${match.id}`}
                        className="text-center"
                      >
                        <div className="text-2xl font-black">
                          {match.homeScore} - {match.awayScore}
                        </div>

                        <div className="mt-1 text-xs font-bold text-slate-500">
                          {match.statusLong ??
                            (match.status === "LIVE"
                              ? "LIVE"
                              : match.status)}
                        </div>
                      </Link>

                      <div>
                        <TeamLink
                          id={match.awayId}
                          name={match.away}
                          logo={match.awayLogo}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
                      <Link
                        href={`/match/${match.id}`}
                        className="flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-sm font-semibold hover:bg-slate-700"
                      >
                        Match Details
                      </Link>

                      <FavoriteButton
                        team={{
                          id: match.homeId,
                          name: match.home,
                          logo: match.homeLogo,
                        }}
                      />

                      <FavoriteButton
                        team={{
                          id: match.awayId,
                          name: match.away,
                          logo: match.awayLogo,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
