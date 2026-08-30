import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing match id" },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.API_FOOTBALL_KEY ||
    process.env.API_KEY ||
    process.env.APIFOOTBALL_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "API key not found. Add API_FOOTBALL_KEY=YOUR_KEY to .env.local",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(id)}`,
      {
        headers: {
          "x-apisports-key": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Football API request failed",
          details: data,
        },
        { status: response.status }
      );
    }

    if (!data.response || data.response.length === 0) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data.response[0]);
  } catch (error) {
    console.error("Match API error:", error);

    return NextResponse.json(
      { error: "Unable to load match details" },
      { status: 500 }
    );
  }
}
