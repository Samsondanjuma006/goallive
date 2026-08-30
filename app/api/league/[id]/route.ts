import { NextRequest, NextResponse } from "next/server";

const API_URL = "https://v3.football.api-sports.io";

function getApiKey() {
  return (
    process.env.API_FOOTBALL_KEY ||
    process.env.API_SPORTS_KEY ||
    process.env.API_KEY ||
    ""
  );
}

async function footballApi(
  endpoint: string,
  params: Record<string, string>
) {
  const key = getApiKey();

  if (!key) {
    throw new Error(
      "API key missing. Add API_FOOTBALL_KEY to .env.local"
    );
  }

  const url = new URL(`${API_URL}/${endpoint}`);

  Object.entries(params).forEach(([name, value]) => {
    url.searchParams.set(name, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": key,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const searchParams = request.nextUrl.searchParams;

    const season =
      searchParams.get("season") ||
      new Date().getFullYear().toString();

    const type =
      searchParams.get("type") || "overview";

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid league ID" },
        { status: 400 }
      );
    }

    if (type === "standings") {
      const data = await footballApi("standings", {
        league: id,
        season,
      });

      return NextResponse.json(data);
    }

    if (type === "fixtures") {
      const data = await footballApi("fixtures", {
        league: id,
        season,
        next: "50",
      });

      return NextResponse.json(data);
    }

    if (type === "results") {
      const data = await footballApi("fixtures", {
        league: id,
        season,
        last: "50",
      });

      return NextResponse.json(data);
    }

    if (type === "live") {
      const data = await footballApi("fixtures", {
        league: id,
        season,
        live: "all",
      });

      return NextResponse.json(data);
    }

    const [standings, fixtures, results, live] =
      await Promise.all([
        footballApi("standings", {
          league: id,
          season,
        }),
        footballApi("fixtures", {
          league: id,
          season,
          next: "20",
        }),
        footballApi("fixtures", {
          league: id,
          season,
          last: "20",
        }),
        footballApi("fixtures", {
          league: id,
          season,
          live: "all",
        }),
      ]);

    return NextResponse.json({
      standings,
      fixtures,
      results,
      live,
    });
  } catch (error) {
    console.error("League API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load league",
      },
      { status: 500 }
    );
  }
}
