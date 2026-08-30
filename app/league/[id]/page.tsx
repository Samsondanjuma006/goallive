"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Team = {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
};

type Match = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

const leagueNames: Record<string, string> = {
  "39": "Premier League",
  "140": "La Liga",
  "135": "Serie A",
  "78": "Bundesliga",
  "2": "Champions League",
  "253": "Major League Soccer",
  "262": "Liga MX",
  "222": "NWSL Women",
};

export default function LeaguePage() {
  const params = useParams();
  const id = String(params.id);

  const [tab, setTab] = useState<"standings" | "fixtures" | "results">(
    "standings"
  );

  const [standings, setStandings] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const leagueName = leagueNames[id] || "Football League";

  useEffect(() => {
    async function loadLeague() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/league?id=${id}`);

        if (!response.ok) {
          throw new Error("Unable to load league data");
        }

        const data = await response.json();

        setStandings(data.standings || []);
        setFixtures(data.fixtures || []);
        setResults(data.results || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load league data right now.");
      } finally {
        setLoading(false);
      }
    }

    loadLeague();
  }, [id]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <Link
            href="/"
            className="text-sm font-semibold text-green-400 hover:text-green-300"
          >
            ← Back to GoalLive
          </Link>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-3xl">
              🏆
            </div>

            <div>
              <h1 className="text-2xl font-black">{leagueName}</h1>
              <p className="text-sm text-slate-400">
                Standings, fixtures and results
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {[
            ["standings", "📊 Standings"],
            ["fixtures", "📅 Fixtures"],
            ["results", "✅ Results"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setTab(value as "standings" | "fixtures" | "results")
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                tab === value
                  ? "bg-green-500 text-slate-950"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <div className="text-4xl">⚽</div>
            <p className="mt-3 font-semibold">Loading {leagueName}...</p>
            <p className="mt-1 text-sm text-slate-500">
              Getting the latest league data
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-8 text-center">
            <div className="text-4xl">⚠️</div>
            <p className="mt-3 font-semibold">{error}</p>
          </div>
        ) : tab === "standings" ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold">📊 League Standings</h2>
              <p className="mt-1 text-sm text-slate-400">
                Current table for {leagueName}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="grid grid-cols-[42px_1fr_42px_42px_42px_50px] gap-2 border-b border-slate-800 bg-slate-950 px-3 py-3 text-xs font-bold text-slate-500">
                <span>#</span>
                <span>TEAM</span>
                <span className="text-center">P</span>
                <span className="text-center">W</span>
                <span className="text-center">GD</span>
                <span className="text-center">PTS</span>
              </div>

              {standings.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No standings available.
                </div>
              ) : (
                standings.map((team) => (
                  <div
                    key={team.team.id}
                    className="grid grid-cols-[42px_1fr_42px_42px_42px_50px] items-center gap-2 border-b border-slate-800 px-3 py-3 last:border-0"
                  >
                    <span className="font-bold text-slate-500">
                      {team.rank}
                    </span>

                    <div className="flex min-w-0 items-center gap-2">
                      {team.team.logo ? (
                        <img
                          src={team.team.logo}
                          alt=""
                          className="h-7 w-7 object-contain"
                        />
                      ) : (
                        <span className="text-lg">⚽</span>
                      )}

                      <Link
                        href={`/team/${team.team.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="truncate text-sm font-semibold hover:text-green-400"
                      >
                        {team.team.name}
                      </Link>
                    </div>

                    <span className="text-center text-sm">{team.played}</span>
                    <span className="text-center text-sm">{team.win}</span>
                    <span className="text-center text-sm">
                      {team.goalsDiff > 0
                        ? `+${team.goalsDiff}`
                        : team.goalsDiff}
                    </span>
                    <span className="text-center font-black">
                      {team.points}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : tab === "fixtures" ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold">📅 Upcoming Fixtures</h2>
              <p className="mt-1 text-sm text-slate-400">
                Next matches in {leagueName}
              </p>
            </div>

            <div className="space-y-3">
              {fixtures.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-500">
                  No upcoming fixtures available.
                </div>
              ) : (
                fixtures.map((match) => (
                  <Link
                    key={match.fixture.id}
                    href={`/match/${match.fixture.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500"
                  >
                    <div className="mb-4 text-center text-xs font-semibold text-slate-500">
                      {formatDate(match.fixture.date)}
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center justify-end gap-2 text-right">
                        <span className="text-sm font-bold">
                          {match.teams.home.name}
                        </span>

                        {match.teams.home.logo && (
                          <img
                            src={match.teams.home.logo}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        )}
                      </div>

                      <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400">
                        VS
                      </div>

                      <div className="flex items-center gap-2">
                        {match.teams.away.logo && (
                          <img
                            src={match.teams.away.logo}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        )}

                        <span className="text-sm font-bold">
                          {match.teams.away.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold">✅ Recent Results</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest completed matches in {leagueName}
              </p>
            </div>

            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-500">
                  No recent results available.
                </div>
              ) : (
                results.map((match) => (
                  <Link
                    key={match.fixture.id}
                    href={`/match/${match.fixture.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-green-500"
                  >
                    <div className="mb-4 text-center text-xs text-slate-500">
                      {formatDate(match.fixture.date)}
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="flex items-center justify-end gap-2 text-right">
                        <span className="text-sm font-bold">
                          {match.teams.home.name}
                        </span>

                        {match.teams.home.logo && (
                          <img
                            src={match.teams.home.logo}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-xl font-black">
                          {match.goals.home ?? "-"} -{" "}
                          {match.goals.away ?? "-"}
                        </div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500">
                          FT
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {match.teams.away.logo && (
                          <img
                            src={match.teams.away.logo}
                            alt=""
                            className="h-8 w-8 object-contain"
                          />
                        )}

                        <span className="text-sm font-bold">
                          {match.teams.away.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-slate-900 px-4 py-10 text-center text-xs text-slate-600">
        GoalLive © 2026 · Real football data
      </footer>
    </main>
  );
}
