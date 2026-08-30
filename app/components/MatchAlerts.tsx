"use client";

import { useEffect, useRef, useState } from "react";
import { loadFavorites, type FavoritesState } from "@/app/lib/favorites";

type AlertMatch = {
  id: number;
  homeId?: number;
  home?: string;
  awayId?: number;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  time?: string;
};

type StoredMatch = {
  homeScore: number;
  awayScore: number;
  status: string;
};

const STORAGE_KEY = "goallive-alert-snapshots";
const ENABLED_KEY = "goallive-alerts-enabled";

function extractMatches(data: any): AlertMatch[] {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.response)
      ? data.response
      : Array.isArray(data?.matches)
        ? data.matches
        : [];

  return rows.map((item: any) => {
    const fixture = item.fixture ?? item;
    const teams = item.teams ?? {};
    const goals = item.goals ?? {};
    const status = fixture.status ?? {};

    return {
      id: Number(fixture.id ?? item.id ?? 0),
      homeId: Number(teams.home?.id ?? item.homeId ?? 0),
      home: teams.home?.name ?? item.home ?? "Home",
      awayId: Number(teams.away?.id ?? item.awayId ?? 0),
      away: teams.away?.name ?? item.away ?? "Away",
      homeScore:
        goals.home == null ? null : Number(goals.home),
      awayScore:
        goals.away == null ? null : Number(goals.away),
      status:
        status.short ??
        item.status ??
        "UNKNOWN",
      time:
        status.elapsed != null
          ? `${status.elapsed}'`
          : item.time ?? "",
    };
  }).filter((match: AlertMatch) => match.id > 0);
}

function isLive(status: string) {
  return [
    "1H",
    "2H",
    "HT",
    "ET",
    "BT",
    "P",
    "LIVE",
  ].includes(status);
}

function isFinished(status: string) {
  return ["FT", "AET", "PEN"].includes(status);
}

function notify(title: string, body: string) {
  try {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body,
        icon: "/icon-192.png",
        tag: `goallive-${Date.now()}`,
      });
    }
  } catch (error) {
    console.error("GoalLive notification error:", error);
  }
}

export default function MatchAlerts() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState("default");
  const [favorites, setFavorites] = useState<FavoritesState>({
    teams: [],
    leagues: [],
  });

  const snapshots = useRef<Record<string, StoredMatch>>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPermission(
      "Notification" in window
        ? Notification.permission
        : "unsupported"
    );

    setEnabled(
      localStorage.getItem(ENABLED_KEY) === "true"
    );

    setFavorites(loadFavorites());

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        snapshots.current = JSON.parse(saved);
      }
    } catch {
      snapshots.current = {};
    }

    const refreshFavorites = () => {
      setFavorites(loadFavorites());
    };

    window.addEventListener(
      "goallive-favorites-changed",
      refreshFavorites
    );

    return () => {
      window.removeEventListener(
        "goallive-favorites-changed",
        refreshFavorites
      );
    };
  }, []);

  async function enableAlerts() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    const result = await Notification.requestPermission();

    setPermission(result);

    if (result === "granted") {
      localStorage.setItem(ENABLED_KEY, "true");
      setEnabled(true);

      notify(
        "⚽ GoalLive Alerts Enabled",
        "You will receive goal and match-start alerts while GoalLive is open."
      );
    } else {
      localStorage.setItem(ENABLED_KEY, "false");
      setEnabled(false);
    }
  }

  function disableAlerts() {
    localStorage.setItem(ENABLED_KEY, "false");
    setEnabled(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function checkMatches() {
      try {
        const response = await fetch("/api/live", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        if (cancelled) return;

        const matches: AlertMatch[] = extractMatches(data);
        const nextSnapshots: Record<string, StoredMatch> = {
          ...snapshots.current,
        };

        const favoriteTeamIds = new Set(
          favorites.teams.map((team: any) =>
            Number(team.id)
          )
        );

        for (const match of matches) {
          const key = String(match.id);

          const current: StoredMatch = {
            homeScore: Number(match.homeScore ?? 0),
            awayScore: Number(match.awayScore ?? 0),
            status: match.status ?? "UNKNOWN",
          };

          const previous = snapshots.current[key];

          if (
            enabled &&
            permission === "granted" &&
            previous &&
            isLive(current.status)
          ) {
            const oldHome = previous.homeScore;
            const oldAway = previous.awayScore;

            const newHome = current.homeScore;
            const newAway = current.awayScore;

            const homeScored = newHome > oldHome;
            const awayScored = newAway > oldAway;

            const relevant =
              favoriteTeamIds.size === 0 ||
              favoriteTeamIds.has(Number(match.homeId)) ||
              favoriteTeamIds.has(Number(match.awayId));

            if (relevant && homeScored) {
              notify(
                "⚽ GOAL!",
                `${match.home} scored! ${newHome} - ${newAway}`
              );
            }

            if (relevant && awayScored) {
              notify(
                "⚽ GOAL!",
                `${match.away} scored! ${newHome} - ${newAway}`
              );
            }
          }

          if (
            enabled &&
            permission === "granted" &&
            previous &&
            !isLive(previous.status) &&
            isLive(current.status)
          ) {
            const relevant =
              favoriteTeamIds.size === 0 ||
              favoriteTeamIds.has(Number(match.homeId)) ||
              favoriteTeamIds.has(Number(match.awayId));

            if (relevant) {
              notify(
                "🔴 Match Started",
                `${match.home} vs ${match.away}`
              );
            }
          }

          if (
            enabled &&
            permission === "granted" &&
            previous &&
            !isFinished(previous.status) &&
            isFinished(current.status)
          ) {
            const relevant =
              favoriteTeamIds.size === 0 ||
              favoriteTeamIds.has(Number(match.homeId)) ||
              favoriteTeamIds.has(Number(match.awayId));

            if (relevant) {
              notify(
                "🏁 Full Time",
                `${match.home} ${current.homeScore} - ${current.awayScore} ${match.away}`
              );
            }
          }

          nextSnapshots[key] = current;
        }

        snapshots.current = nextSnapshots;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextSnapshots)
        );

        initialized.current = true;
      } catch (error) {
        console.error(
          "GoalLive alert polling failed:",
          error
        );
      }
    }

    checkMatches();

    const timer = window.setInterval(
      checkMatches,
      30000
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, permission, favorites]);

  if (permission === "unsupported") {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      {!enabled ? (
        <button
          type="button"
          onClick={enableAlerts}
          className="w-full rounded-2xl border border-green-500/40 bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-2xl hover:bg-slate-800"
        >
          🔔 Enable GoalLive Alerts
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-green-500/30 bg-slate-900 px-4 py-3 shadow-2xl">
          <div>
            <div className="text-sm font-bold text-green-400">
              🔔 Alerts On
            </div>
            <div className="text-xs text-slate-400">
              Goals · Match starts · Full time
            </div>
          </div>

          <button
            type="button"
            onClick={disableAlerts}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Turn off
          </button>
        </div>
      )}
    </div>
  );
}
