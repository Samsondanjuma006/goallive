import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://v3.football.api-sports.io";

function headers() {
  return {
    "x-apisports-key": process.env.API_FOOTBALL_KEY || "",
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "League ID is required" },
      { status: 400 }
    );
  }

  const season = new Date().getFullYear();

  try {
    const [standingsResponse, fixturesResponse] = await Promise.all([
      fetch(
        `${API_URL}/standings?league=${id}&season=${season}`,
        {
          headers: headers(),
          cache: "no-store",
        }
      ),

      fetch(
        `${API_URL}/fixtures?league=${id}&season=${season}`,
        {
          headers: headers(),
          cache: "no-store",
        }
      ),
    ]);

    if (!standingsResponse.ok || !fixturesResponse.ok) {
      throw new Error("Football API request failed");
    }

    const standingsData = await standingsResponse.json();
    const fixturesData = await fixturesResponse.json();

    const rawStandings =
      standingsData?.response?.[0]?.league?.standings?.[0] || [];

    const allFixtures = fixturesData?.response || [];

    const completedStatuses = [
      "FT",
      "AET",
      "PEN",
    ];

    const results = allFixtures
      .filter((match: any) =>
        completedStatuses.includes(match.fixture?.status?.short)
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.fixture.date).getTime() -
          new Date(a.fixture.date).getTime()
      )
      .slice(0, 30);

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
      .slice(0, 30);

    return NextResponse.json({
      league: {
        id,
        name: standingsData?.response?.[0]?.league?.name || "Football League",
      },
      standings: rawStandings.map((row: any) => ({
        rank: row.rank,
        team: row.team,
        points: row.points,
        goalsDiff: row.goalsDiff,
        played: row.all?.played || 0,
        win: row.all?.win || 0,
        draw: row.all?.draw || 0,
        lose: row.all?.lose || 0,
      })),
      fixtures,
      results,
    });
  } catch (error) {
    console.error("League API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch league data" },
      { status: 500 }
    );
  }
}
