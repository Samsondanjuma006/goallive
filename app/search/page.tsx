"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Result = {
  type: "team" | "league" | "match";
  id: number;
  name: string;
  subtitle?: string;
  logo?: string;
  href: string;
};

type Match = {
  id: number;
  leagueId?: number;
  league?: string;
  homeId?: number;
  home?: string;
  homeLogo?: string;
  awayId?: number;
  away?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  status?: string;
  time?: string;
};

const leagues = [
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

    return {
      id: Number(fixture.id ?? 0),
      leagueId: Number(league.id ?? 0),
      league: league.name ?? "Unknown League",
      homeId: Number(teams.home?.id ?? 0),
      home: teams.home?.name ?? "Home",
      homeLogo: teams.home?.logo,
      awayId: Number(teams.away?.id ?? 0),
      away: teams.away?.name ?? "Away",
      awayLogo: teams.away?.logo,
      homeScore: Number(goals.home ?? 0),
      awayScore: Number(goals.away ?? 0),
      status: status.short ?? "",
      time:
        status.elapsed != null
          ? `${status.elapsed}'`
          : status.short === "FT"
            ? "FT"
            : "Upcoming",
    };
  });
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") ?? "";
    setQuery(initial);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

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

    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const value = query.trim();

      if (value) {
        window.history.replaceState(
          null,
          "",
          `/search?q=${encodeURIComponent(value)}`
        );
      } else {
        window.history.replaceState(null, "", "/search");
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim();

    if (!q) return [];

    const output: Result[] = [];
    const seen = new Set<string>();

    function add(result: Result) {
      const key = `${result.type}-${result.id}`;

      if (!seen.has(key)) {
        seen.add(key);
        output.push(result);
      }
    }

    leagues
      .filter((league) =>
        league.name.toLowerCase().includes(q)
      )
      .forEach((league) => {
        add({
          type: "league",
          id: league.id,
          name: league.name,
          subtitle: "Competition",
          href: `/league/${league.id}`,
        });
      });

    matches.forEach((match) => {
      if (
        match.home &&
        match.home.toLowerCase().includes(q)
      ) {
        add({
          type: "team",
          id: match.homeId ?? 0,
          name: match.home,
          subtitle: match.league,
          logo: match.homeLogo,
          href: `/team/${match.homeId}`,
        });
      }

      if (
        match.away &&
        match.away.toLowerCase().includes(q)
      ) {
        add({
          type: "team",
          id: match.awayId ?? 0,
          name: match.away,
          subtitle: match.league,
          logo: match.awayLogo,
          href: `/team/${match.awayId}`,
        });
      }

      const matchText =
        `${match.home} ${match.away} ${match.league}`.toLowerCase();

      if (matchText.includes(q)) {
        add({
          type: "match",
          id: match.id,
          name: `${match.home} vs ${match.away}`,
          subtitle: `${match.league} · ${match.time}`,
          href: `/match/${match.id}`,
        });
      }
    });

    return output.slice(0, 40);
  }, [query, matches]);

  const suggestions = leagues.filter((league) =>
    league.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-950 pb-20 text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-2xl font-black"
            >
              ⚽ Goal<span className="text-green-400">Live</span>
            </Link>

            <span className="text-slate-700">/</span>

            <span className="font-semibold text-slate-300">
              Search
            </span>
          </div>

          <div className="mt-4 relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔎
            </span>

            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams, leagues or matches..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-4 pl-11 pr-4 outline-none placeholder:text-slate-500 focus:border-green-500"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {!query.trim() ? (
          <>
            <h2 className="text-xl font-bold">
              🔎 Search GoalLive
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Find teams, competitions and matches.
            </p>

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Popular competitions
              </h3>

              <div className="grid gap-3 sm:grid-cols-2">
                {leagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/league/${league.id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl">
                        🏆
                      </div>

                      <div>
                        <div className="font-bold">
                          {league.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          View fixtures, results & standings
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-4xl">⚽</div>
            <p className="mt-3 text-sm text-slate-400">
              Searching GoalLive...
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-4xl">🔎</div>

            <h2 className="mt-3 font-bold">
              No results found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Try a team, league or match name.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Search results
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {results.length} result
                {results.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="space-y-3">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500"
                >
                  <div className="flex items-center gap-4">
                    {result.logo ? (
                      <img
                        src={result.logo}
                        alt=""
                        className="h-11 w-11 object-contain"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl">
                        {result.type === "league"
                          ? "🏆"
                          : result.type === "match"
                            ? "⚽"
                            : "👕"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-bold">
                        {result.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {result.subtitle}
                      </div>
                    </div>

                    <span className="text-slate-600">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {query.trim() &&
          suggestions.length > 0 &&
          results.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Competitions
              </h3>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((league) => (
                  <Link
                    key={league.id}
                    href={`/league/${league.id}`}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-green-400"
                  >
                    🏆 {league.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
      </section>
    </main>
  );
}
