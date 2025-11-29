import { db } from "../server/db";
import { lotteryGames, lotteryResults } from "../shared/schema";
import { sql } from "drizzle-orm";

// Helper function to generate random numbers
function generateWinningNumbers(count: number, maxNumber: number): number[] {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * maxNumber) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

// Helper function to get draw dates for a specific game
function getDrawDatesForGame(
  gameSlug: string,
  startDate: Date,
  endDate: Date
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    let shouldAdd = false;

    if (gameSlug === "powerball" || gameSlug === "powerball-plus") {
      // Tuesday (2) and Friday (5)
      shouldAdd = dayOfWeek === 2 || dayOfWeek === 5;
    } else if (
      gameSlug === "lotto" ||
      gameSlug === "lotto-plus-1" ||
      gameSlug === "lotto-plus-2"
    ) {
      // Wednesday (3) and Saturday (6)
      shouldAdd = dayOfWeek === 3 || dayOfWeek === 6;
    } else if (gameSlug === "daily-lotto" || gameSlug === "daily-lotto-plus") {
      // Every day
      shouldAdd = true;
    }

    if (shouldAdd) {
      dates.push(current.toISOString().split("T")[0]);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Helper function to get random jackpot amount
function getRandomJackpot(): string {
  const baseAmount = Math.floor(Math.random() * 20000000) + 1000000;
  return `R ${baseAmount.toLocaleString()}`;
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Delete existing results to avoid duplicates
    await db.delete(lotteryResults);
    console.log("Cleared existing lottery results");

    // Date range: October 1, 2025 to November 29, 2025
    const startDate = new Date("2025-10-01");
    const endDate = new Date("2025-11-29");

    // Get all games from the database
    const games = await db.select().from(lotteryGames);

    if (games.length === 0) {
      console.log("No games found in database");
      return;
    }

    let totalInserted = 0;

    for (const game of games) {
      console.log(`\nGenerating data for ${game.name}...`);

      const drawDates = getDrawDatesForGame(game.slug, startDate, endDate);
      console.log(`Found ${drawDates.length} draw dates for ${game.slug}`);

      for (const drawDate of drawDates) {
        const winningNumbers = generateWinningNumbers(
          game.numberCount || 6,
          game.maxNumber || 50
        );
        const bonusNumber = game.hasBonusBall
          ? Math.floor(Math.random() * (game.bonusMaxNumber || 20)) + 1
          : null;

        await db.insert(lotteryResults).values({
          gameId: game.id,
          gameName: game.name,
          gameSlug: game.slug,
          winningNumbers,
          bonusNumber: bonusNumber || undefined,
          drawDate,
          jackpotAmount: getRandomJackpot(),
          nextJackpot: getRandomJackpot(),
        });

        totalInserted++;
      }
    }

    console.log(`\n✓ Successfully seeded database with ${totalInserted} records`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase().then(() => {
  console.log("Seeding complete");
  process.exit(0);
});
