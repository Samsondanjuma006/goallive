#!/data/data/com.termux/files/usr/bin/bash

mkdir -p app

cat > app/page.tsx <<'PAGE'
"use client";

import { useState } from "react";

type Match = {
  league: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  time: string;
  status: "LIVE" | "UPCOMING" | "FT";
};

const matches: Match[] = [
  {
    league: "Premier League",
    home: "Arsenal",
    away: "Chelsea",
    homeScore: 2,
    awayScore: 1,
    time: "67'",
    status: "LIVE",
  },
  {
    league: "La Liga",
    home: "Barcelona",
    away: "Real Madrid",
    homeScore: 1,
    awayScore: 1,
    time: "HT",
    status: "LIVE",
  },
  {
    league: "Serie A",
    home: "Inter Milan",
    away: "AC Milan",
    homeScore: 0,
    awayScore: 0,
    time: "20'",
    status: "LIVE",
  },
  {
    league: "Premier League",
    home: "Liverpool",
    away: "Manchester City",
    homeScore: 0,
    awayScore: 0,
    time: "Tomorrow 16:00",
    status: "UPCOMING",
  },
  {
    league: "Bundesliga",
    home: "Bayern Munich",
    away: "Dortmund",
    homeScore: 3,
    awayScore: 1,
    time: "FT",
    status: "FT",
  },
];

const leagues = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Champions League",
];

export default function Home() {
  const [tab, setTab] = useState("Live");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredMatches = matches.filter((match) => {
    const text =
      `${match.home} ${match.away} ${match.league}`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  function toggleFavorite(team: string) {
    setFavorites((current) =>
      current.includes(team)
        ? current.filter((item) => item !== team)
        : [...current, team]
    );
  }

  const visibleMatches =
    tab === "Live"
      ? filteredMatches.filter((m) => m.status === "LIVE")
      : tab === "Fixtures"
        ? filteredMatches.filter((m) => m.status === "UPCOMING")
        : tab === "Results"
          ? filteredMatches.filter((m) => m.status === "FT")
          : filteredMatches;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                ⚽ Goal<span className="text-green-400">Live</span>
              </h1>
              <p className="text-xs text-slate-400">
                Live football scores
              </p>
            </div>

            <div className="rounded-full bg-slate-900 px-3 py-2 text-sm">
              ⭐ {favorites.length}
            </div>
          </div>

          <div className="mt-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams or leagues..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-green-500"
            />
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {["Live", "Fixtures", "Results", "Leagues"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
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
            <h2 className="text-xl font-bold">🏆 Competitions</h2>
            <p className="mt-1 text-sm text-slate-400">
              Follow your favorite competitions
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {leagues.map((league) => (
                <button
                  key={league}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-green-500"
                >
                  <div className="text-2xl">🏆</div>
                  <div className="mt-3 font-bold">{league}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    View fixtures, results and standings
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                {tab === "Live"
                  ? "🔴 Live Matches"
                  : tab === "Fixtures"
                    ? "📅 Upcoming Fixtures"
                    : "✅ Recent Results"}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {visibleMatches.length} match
                {visibleMatches.length === 1 ? "" : "es"}
              </p>
            </div>

            <div className="space-y-4">
              {visibleMatches.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                  <div className="text-4xl">⚽</div>
                  <p className="mt-3 font-semibold">
                    No matches found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Try another search.
                  </p>
                </div>
              ) : (
                visibleMatches.map((match) => (
                  <article
                    key={`${match.home}-${match.away}`}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        🏆 {match.league}
                      </span>

                      {match.status === "LIVE" ? (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                          🔴 {match.time}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">
                          {match.time}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">{match.home}</p>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-black">
                          {match.homeScore} - {match.awayScore}
                        </div>

                        {match.status === "LIVE" && (
                          <div className="mt-1 text-xs font-bold text-green-400">
                            LIVE
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-bold">{match.away}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 border-t border-slate-800 pt-4">
                      <button className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold hover:bg-slate-700">
                        Match Details
                      </button>

                      <button
                        onClick={() => toggleFavorite(match.home)}
                        className="rounded-xl bg-slate-800 px-4 hover:bg-slate-700"
                      >
                        {favorites.includes(match.home) ? "⭐" : "☆"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-slate-900 px-4 py-10 text-center text-xs text-slate-600">
        GoalLive © 2026 · Football scores made simple
      </footer>
    </main>
  );
}
PAGE

cat > app/globals.css <<'CSS'
@import "tailwindcss";

* {
  box-sizing: border-box;
}

html {
  background: #020617;
}

body {
  margin: 0;
  background: #020617;
}
CSS

echo ""
echo "================================"
echo "   GOALLIVE SETUP COMPLETE ⚽"
echo "================================"
echo ""
echo "Start the app with:"
echo "npm run dev -- --webpack"
echo ""
