import Link from "next/link";
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Event = {
  time?: {
    elapsed?: number;
    extra?: number | null;
  };
  team?: {
    id?: number;
    name?: string;
    logo?: string;
  };
  player?: {
    name?: string | null;
  };
  assist?: {
    name?: string | null;
  };
  type?: string;
  detail?: string;
  comments?: string | null;
};

type Match = {
  fixture?: {
    id?: number;
    referee?: string | null;
    timezone?: string;
    date?: string;
    venue?: {
      name?: string | null;
      city?: string | null;
    };
    status?: {
      long?: string;
      short?: string;
      elapsed?: number | null;
      extra?: number | null;
    };
  };
  league?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
      logo?: string;
      winner?: boolean | null;
    };
    away?: {
      id?: number;
      name?: string;
      logo?: string;
      winner?: boolean | null;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
  };
  events?: Event[];
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMatch() {
    try {
      setError("");

      const response = await fetch(`/api/match?id=${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load match");
      }

      setMatch(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load match details"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    loadMatch();

    const timer = setInterval(loadMatch, 30000);

    return () => clearInterval(timer);
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 rounded-xl bg-slate-800 px-4 py-2 text-sm"
          >
            ← Back
          </button>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <div className="text-4xl">⚽</div>
            <p className="mt-3 text-slate-400">
              Loading match...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !match) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 rounded-xl bg-slate-800 px-4 py-2 text-sm"
          >
            ← Back
          </button>

          <div className="rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
            <div className="text-4xl">⚠️</div>

            <h1 className="mt-3 text-xl font-bold">
              Match unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {error || "We could not find this match."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const home = match.teams?.home;
  const away = match.teams?.away;

  const homeScore = match.goals?.home ?? 0;
  const awayScore = match.goals?.away ?? 0;

  const status =
    match.fixture?.status?.long ||
    match.fixture?.status?.short ||
    "Unknown";

  const elapsed = match.fixture?.status?.elapsed;

  const events = match.events || [];

  const goals = events.filter(
    (event) => event.type === "Goal"
  );

  const cards = events.filter(
    (event) => event.type === "Card"
  );

  const substitutions = events.filter(
    (event) => event.type === "subst"
  );

  function eventMinute(event: Event) {
    const minute = event.time?.elapsed;

    if (!minute) return "";

    const extra = event.time?.extra;

    return extra
      ? `${minute}+${extra}'`
      : `${minute}'`;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <button
            onClick={() => router.back()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            ← Back
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {match.league?.logo && (
                <img
                  src={match.league.logo}
                  alt=""
                  className="h-7 w-7 object-contain"
                />
              )}

              <div>
                <p className="text-sm font-bold">
                  {match.league?.name}
                </p>

                <p className="text-xs text-slate-500">
                  {match.league?.country}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              🔴 {elapsed ? `${elapsed}'` : status}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="text-center">
              {home?.logo && (
                <img
                  src={home.logo}
                  alt={home.name || "Home team"}
                  className="mx-auto h-20 w-20 object-contain"
                />
              )}

              <h2 className="mt-3 font-bold">
                {home?.name}
              </h2>
            </div>

            <div className="text-center">
              <div className="text-4xl font-black">
                {homeScore} - {awayScore}
              </div>

              <p className="mt-2 text-xs font-semibold text-green-400">
                {status}
              </p>
            </div>

            <div className="text-center">
              {away?.logo && (
                <img
                  src={away.logo}
                  alt={away.name || "Away team"}
                  className="mx-auto h-20 w-20 object-contain"
                />
              )}

              <h2 className="mt-3 font-bold">
                {away?.name}
              </h2>
            </div>
          </div>

          {match.score?.halftime && (
            <div className="mt-6 text-center text-sm text-slate-400">
              Half-time:{" "}
              <span className="font-bold text-white">
                {match.score.halftime.home ?? 0} -{" "}
                {match.score.halftime.away ?? 0}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-bold">🏟️ Venue</h3>

            <p className="mt-2 text-sm text-slate-300">
              {match.fixture?.venue?.name ||
                "Venue unavailable"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {match.fixture?.venue?.city || ""}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-bold">👨‍⚖️ Referee</h3>

            <p className="mt-2 text-sm text-slate-300">
              {match.fixture?.referee ||
                "Referee unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold">
            ⚡ Match Events
          </h2>

          {events.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No events recorded yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {events.map((event, index) => (
                <div
                  key={`${event.time?.elapsed}-${index}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-950 p-3"
                >
                  <span className="w-12 text-xs font-bold text-green-400">
                    {eventMinute(event)}
                  </span>

                  <span className="text-xl">
                    {event.type === "Goal"
                      ? "⚽"
                      : event.type === "Card"
                        ? event.detail?.toLowerCase().includes("red")
                          ? "🟥"
                          : "🟨"
                        : event.type === "subst"
                          ? "🔄"
                          : "•"}
                  </span>

                  <div className="min-w-0">
                    <p className="font-semibold">
                      {event.player?.name ||
                        event.type}
                    </p>

                    <p className="text-xs text-slate-500">
                      {event.detail || ""}
                      {event.team?.name
                        ? ` · ${event.team.name}`
                        : ""}
                    </p>

                    {event.assist?.name && (
                      <p className="text-xs text-slate-600">
                        Assist: {event.assist.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-2xl">⚽</div>
            <p className="mt-2 text-2xl font-black">
              {goals.length}
            </p>
            <p className="text-xs text-slate-500">
              Goals
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-2xl">🟨</div>
            <p className="mt-2 text-2xl font-black">
              {
                cards.filter(
                  (event) =>
                    !event.detail
                      ?.toLowerCase()
                      .includes("red")
                ).length
              }
            </p>
            <p className="text-xs text-slate-500">
              Yellow cards
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-2xl">🔄</div>
            <p className="mt-2 text-2xl font-black">
              {substitutions.length}
            </p>
            <p className="text-xs text-slate-500">
              Substitutions
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Match data refreshes automatically every 30 seconds.
        </p>
      </section>
    </main>
  );
}
