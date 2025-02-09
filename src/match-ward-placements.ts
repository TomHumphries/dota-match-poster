import './env'
import path from 'path';
import axios from 'axios';

import { WardMapper } from './warding/WardMapper';
import { IdStore } from './MatchIdStore';
import { PlayersStore } from './players/PlayersStore';
import { WardMapPoster } from './warding/WardMapPoster';

// check for the required environment variables
const DISCORD_WEBHOOK_ID = process.env.DISCORD_WEBHOOK_ID;
if (!DISCORD_WEBHOOK_ID) throw new Error("DISCORD_WEBHOOK_ID is required");
const DISCORD_WEBHOOK_TOKEN = process.env.DISCORD_WEBHOOK_TOKEN;
if (!DISCORD_WEBHOOK_TOKEN) throw new Error("DISCORD_WEBHOOK_TOKEN is required");

const STRATZ_API_KEY = process.env.STRATZ_API_KEY;
if (!STRATZ_API_KEY) throw new Error("STRATZ_API_KEY is required");
const minimapFilepath = path.join(__dirname, '../assets/minimap.png');

const matchesWithWardMapsStore = new IdStore(path.join(__dirname, "../matches_with_ward_maps.txt"));
const playersStore = new PlayersStore(path.join(__dirname, "../players.json"));
const wardMapPoster = new WardMapPoster(
    DISCORD_WEBHOOK_ID, 
    DISCORD_WEBHOOK_TOKEN, 
    STRATZ_API_KEY,
    new WardMapper(minimapFilepath), 
    path.join(__dirname, "../ward-maps"),
);

async function main() {
    const players = await playersStore.loadPlayers();

    const attemptedMatches = new Set<number>();

    const recentMatchIds = await getRecentlyPlayedMatchIds(players.map(player => player.id));
    const uniqueMatchIds = Array.from(new Set(recentMatchIds));

    for (const matchId of uniqueMatchIds) {
        const alreadyReportedOn = await matchesWithWardMapsStore.hasId(matchId.toString());
        if (alreadyReportedOn || attemptedMatches.has(matchId)) continue;

        attemptedMatches.add(matchId);
        await wardMapPoster.postWardMap(matchId);
        await matchesWithWardMapsStore.addId(matchId.toString());
    }
}

async function getRecentlyPlayedMatchIds(accountIds: number[], matchersPerPlayer: number = 1): Promise<number[]> {
  if (accountIds.length === 0) return [];
  const query = `
{
  players(steamAccountIds: [${accountIds.join(', ')}]) {
    steamAccountId
    matches(request: {take: ${matchersPerPlayer}}) {
      id
    }
  }
}
`
  const response = await axios.post(
    'https://api.stratz.com/graphql',
    { query },
    {
    headers: {
        Authorization: `Bearer ${STRATZ_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "STRATZ_API",
    },
    }
  );
  const matchIds = new Set<number>();
  for (const player of response.data.data.players) {
    for (const match of player.matches) {
      matchIds.add(match.id);
    }
  }
  return Array.from(matchIds);
}

main()
    .then(() => {
        console.log("✅ Ward maps checked successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ An error occurred while checking ward maps:", error);
        process.exit(1);
    })
