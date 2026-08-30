"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Team = {
  id: number;
  name: string;
  logo: string;
  country?: string;
  founded?: number;
};

type Venue = {
  name?: string;
  city?: string;
  capacity?: number;
  image?: string;
};

type Match = {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
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

type Scorer = {
  player: {
    id: number;
    name: string;
    photo?: string;
  };
  goals: number;
  assists: number;
  appearances: number;
};

export default function TeamPage() {
  const params = useParams();
  const id = String(params.id);

  const [team, setTeam] = useState<Team | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [results, setResults] = useState<Match[]>([]);
  const [form, setForm] = useState<string[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        setLoading(true);

        const response = await fetch(`/api/team?id=${id}`);

        if (!response.ok) {
          throw new Error("Failed to load team");
        }

        const data = await response.json();

        setTeam(data.team);
        setVenue(data.venue);
        setFixtures(data.fixtures || []);
        setResults(data.results || []);
        setForm(data.form || []);
        setScorers(data.scorers || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load team data.");
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, [id]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderMatch(match: Match, completed: boolean) {
    const home = match.teams.home;
    const away = match.teams.away;

    return (
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
            <span className="text-sm font-bold">{home.name}</span>

            {home.logo && (
              <img
                src={home.logo}
                alt=""
                className="h-8 w-8 object-contain"
              />
            )}
          </div>

          <div className="text-center">
            {completed ? (
              <>
                <div className="text-xl font-black">
                  {match.goals.home ?? "-"} - {match.goals.away ?? "-"}
                </div>
                <div className="mt-1 text-[10px] font-bold text-slate-500">
                  FT
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-400">
                VS
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {away.logo && (
              <img
                src={away.logo}
                alt=""
                className="h-8 w-8 object-contain"
              />
            )}

            <span className="text-sm font-bold">{away.name}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-center text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-10">
          <div className="text-4xl">⚽</div>
          <p className="mt-3 font-semibold">Loading team...</p>
        </div>
      </main>
    );
  }

  if (error || !team) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-900 bg-red-950/30 p-10 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="mt-3 font-semibold">
            {error || "Team not found"}
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-sm font-bold text-green-400"
          >
            ← Back to GoalLive
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <Link
            href="/"
            className="text-sm font-semibold text-green-400"
          >
            ← Back to GoalLive
          </Link>

          <div className="mt-5 flex items-center gap-4">
            {team.logo && (
              <img
                src={team.logo}
                alt={team.name}
                className="h-20 w-20 object-contain"
              />
            )}

            <div>
              <h1 className="text-2xl font-black">{team.name}</h1>

              <p className="text-sm text-slate-400">
                {team.country || "Football Club"}
              </p>

              {team.founded && (
                <p className="mt-1 text-xs text-slate-500">
                  Founded {team.founded}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase text-slate-500">
              Recent Form
            </p>

            <div className="mt-4 flex gap-2">
              {form.length === 0 ? (
                <span className="text-sm text-slate-500">
                  No recent results
                </span>
              ) : (
                form.map((result, index) => (
                  <span
                    key={`${result}-${index}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${
                      result === "W"
                        ? "bg-green-500 text-slate-950"
                        : result === "L"
                          ? "bg-red-500 text-white"
                          : result === "D"
                            ? "bg-yellow-500 text-slate-950"
                            : "bg-slate-700 text-white"
                    }`}
                  >
                    {result}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase text-slate-500">
              Stadium
            </p>

            <p className="mt-3 font-bold">
              {venue?.name || "Venue unavailable"}
            </p>

            {venue?.city && (
              <p className="mt-1 text-sm text-slate-400">
                📍 {venue.city}
              </p>
            )}

            {venue?.capacity && (
              <p className="mt-1 text-xs text-slate-500">
                Capacity: {venue.capacity.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-black">📅 Upcoming Fixtures</h2>
          <p className="mt-1 text-sm text-slate-400">
            Next matches for {team.name}
          </p>

          <div className="mt-4 space-y-3">
            {fixtures.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-500">
                No upcoming fixtures.
              </div>
            ) : (
              fixtures.map((match) => renderMatch(match, false))
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-black">✅ Recent Results</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest completed matches
          </p>

          <div className="mt-4 space-y-3">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-500">
                No recent results.
              </div>
            ) : (
              results.map((match) => renderMatch(match, true))
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-black">⚽ Top Scorers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Leading scorers for {team.name}
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            {scorers.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No scorer data available.
              </div>
            ) : (
              scorers.map((scorer, index) => (
                <div
                  key={scorer.player.id}
                  className="flex items-center gap-3 border-b border-slate-800 p-4 last:border-0"
                >
                  <span className="w-6 text-sm font-black text-slate-500">
                    {index + 1}
                  </span>

                  {scorer.player.photo ? (
                    <img
                      src={scorer.player.photo}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                      👤
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {scorer.player.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {scorer.appearances} appearances ·{" "}
                      {scorer.assists} assists
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-green-400">
                      {scorer.goals}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Goals
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-900 px-4 py-10 text-center text-xs text-slate-600">
        GoalLive © 2026 · Real football data
      </footer>
    </main>
  );
}
