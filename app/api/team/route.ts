import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://v3.football.api-sports.io";

function apiHeaders() {
  return {
    "x-apisports-key": process.env.API_FOOTBALL_KEY || "",
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Team ID is required" },
      { status: 400 }
    );
  }

  const season = new Date().getFullYear();

  try {
    const responses = await Promise.all([
      fetch(`${API_URL}/teams?id=${id}`, {
        headers: apiHeaders(),
        cache: "no-store",
      }),

      fetch(`${API_URL}/fixtures?team=${id}&season=${season}`, {
        headers: apiHeaders(),
        cache: "no-store",
      }),

      fetch(`${API_URL}/players/topscorers?team=${id}&season=${season}`, {
        headers: apiHeaders(),
        cache: "no-store",
      }),
    ]);

    if (responses.some((response) => !response.ok)) {
      throw new Error("Football API request failed");
    }

    const teamData = await responses[0].json();
    const fixturesData = await responses[1].json();
    const scorersData = await responses[2].json();

    const team = teamData?.response?.[0]?.team || null;
    const venue = teamData?.response?.[0]?.venue || null;
    const allFixtures = fixturesData?.response || [];

    const completedStatuses = ["FT", "AET", "PEN"];

    const results = allFixtures
      .filter((match: any) =>
        completedStatuses.includes(match.fixture?.status?.short)
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.fixture.date).getTime() -
          new Date(a.fixture.date).getTime()
      )
      .slice(0, 10);

    const fixtures = allFixtures
      .filter(
        (match: any) =>
          !completedStatuses.includes(match.fixture?.status?.short)
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.fixture.date).getTime() -
          new Date(b.fixture.date).getTime()
      )
      .slice(0, 10);

    const form = results
      .slice(0, 5)
      .reverse()
      .map((match: any) => {
        const isHome = match.teams?.home?.id === Number(id);
        const teamGoals = isHome
          ? match.goals?.home
          : match.goals?.away;
        const opponentGoals = isHome
          ? match.goals?.away
          : match.goals?.home;

        if (teamGoals == null || opponentGoals == null) return "?";
        if (teamGoals > opponentGoals) return "W";
        if (teamGoals < opponentGoals) return "L";
        return "D";
      });

    const scorers = (scorersData?.response || [])
      .slice(0, 10)
      .map((item: any) => ({
        player: item.player,
        goals: item.statistics?.[0]?.goals?.total || 0,
        assists: item.statistics?.[0]?.goals?.assists || 0,
        appearances:
          item.statistics?.[0]?.games?.appearences || 0,
      }));

    return NextResponse.json({
      team,
      venue,
      fixtures,
      results,
      form,
      scorers,
    });
  } catch (error) {
    console.error("Team API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch team data" },
      { status: 500 }
    );
  }
}
