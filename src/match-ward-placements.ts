import './env'
import path from "path";
import { WardMapper } from './warding/WardMapper';
import { WardsSource } from './warding/WardsSource';
import { IdStore } from './MatchIdStore';
import { PlayersStore } from './players/PlayersStore';
import { OpenDota } from 'opendota.js';
import { IRecentMatch } from './match-posters/IRecentMatch';
import { WardMapPoster } from './warding/WardMapPoster';

// check for the required environment variables
const DISCORD_WEBHOOK_ID = process.env.DISCORD_WEBHOOK_ID;
if (!DISCORD_WEBHOOK_ID) throw new Error("DISCORD_WEBHOOK_ID is required");
const DISCORD_WEBHOOK_TOKEN = process.env.DISCORD_WEBHOOK_TOKEN;
if (!DISCORD_WEBHOOK_TOKEN) throw new Error("DISCORD_WEBHOOK_TOKEN is required");

const STRATZ_API_KEY = process.env.STRATZ_API_KEY;
if (!STRATZ_API_KEY) throw new Error("STRATZ_API_KEY is required");
const minimapFilepath = path.join(__dirname, '../assets/minimap.png');

const openDotaClient = new OpenDota();

const matchesWithWardMapsStore = new IdStore(path.join(__dirname, "../matches_with_ward_maps.txt"));
const playersStore = new PlayersStore(path.join(__dirname, "../players.json"));
const wardMapPoster = new WardMapPoster(
    DISCORD_WEBHOOK_ID, 
    DISCORD_WEBHOOK_TOKEN, 
    new WardsSource(STRATZ_API_KEY), 
    openDotaClient,
    new WardMapper(minimapFilepath), 
    path.join(__dirname, "../ward-maps"),
);

async function main() {
    const players = await playersStore.loadPlayers();

    const attemptedMatches = new Set<number>();

    for (const player of players) {
        try {
            const recentMatches = await openDotaClient.getRecentMatches(player.id);
            const lastMatch: IRecentMatch | undefined = recentMatches[0];
            if (!lastMatch) continue;
            
            const alreadyReportedOn = await matchesWithWardMapsStore.hasId(lastMatch.match_id.toString());
            if (alreadyReportedOn || attemptedMatches.has(lastMatch.match_id)) continue;
            
            // Stratz might not have processed the match, which could cause the ward lookup to fail
            // but we don't want to retry the same match again this time round for all of the players that were in it
            attemptedMatches.add(lastMatch.match_id);
            await wardMapPoster.postWardMap(lastMatch.match_id);
            await matchesWithWardMapsStore.addId(lastMatch.match_id.toString());
        } catch (error) {
            console.error(`An error occurred while processing player ${player.id}:`, error);
        }
    }
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
