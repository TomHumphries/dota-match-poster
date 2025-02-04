import "./env";

import axios from "axios";
import fs from "fs";
import path from "path";

import { IPlayer } from "./IPlayer";
import { IRecentMatch } from "./match-posters/IRecentMatch";
import { IDotaPoster } from "./match-posters/DotaPoster";
import { loadMatchPosters } from "./match-posters/MatchPosterLoading";

export const matchPosters: IDotaPoster[] = loadMatchPosters();

const players: {name: string; id: number}[] = JSON.parse(fs.readFileSync(path.join(__dirname, "../players.json"), "utf8"))

const MATCH_HISTORY_FILE = "last_matches.json";
const MAX_AGE_MS = 1000 * 60 * 60 * 2; // 2 hours

// Load the last reported matches for each player
let lastNotifiedPlayerMatchIds: Record<string, number> = {};
if (fs.existsSync(MATCH_HISTORY_FILE)) {
    lastNotifiedPlayerMatchIds = JSON.parse(fs.readFileSync(MATCH_HISTORY_FILE, "utf8"));
}

/**
 * Fetch the most recent match for a player
 */
async function getLastMatch(playerId: string): Promise<IRecentMatch | null> {
    try {
        const response = await axios.get<IRecentMatch[]>(`https://api.opendota.com/api/players/${playerId}/recentMatches`);
        const matches = response.data;
        const lastMatch = matches[0];
        if (!lastMatch) return null;

        return lastMatch;
    } catch (error) {
        console.error(`❌ Error fetching matches for player ${playerId}:`, (error as Error).message);
        return null;
    }
}

async function getPlayerProfile(playerId: number): Promise<IPlayer> {
    const response = await axios.get<IPlayer>(`https://api.opendota.com/api/players/${playerId}`);
    return response.data
}

/**
 * Main function to check for new matches and post about them
 */
async function checkMatches(): Promise<void> {
    for (const player of players) {
        // get the most recent match for the player
        const lastMatch = await getLastMatch(player.id.toString());
        if (!lastMatch) {
            console.warn(`No match found for player ${player.name}`);
            continue;
        }

        // if the match is old (i.e. the script hasn't run for a while), skip it
        const lastMatchTime = new Date(lastMatch.start_time * 1000);
        const maxAge = new Date(Date.now() - MAX_AGE_MS);
        if (lastMatchTime.valueOf() < maxAge.valueOf()) continue;

        if (process.env.SKIP_MATCH_ALREADY_POSTED_CHECK=='true') {
            console.log(`SKIP_MATCH_ALREADY_POSTED_CHECK is true`);
        } else {
            // if a notification has already been sent for this match, skip it
            const lastCachedMatchId = lastNotifiedPlayerMatchIds[player.id] ?? null;
            if (lastCachedMatchId && lastMatch.match_id === lastCachedMatchId) continue
        }
        
        
        // Save updated match history for each user in case of an early exit
        lastNotifiedPlayerMatchIds[player.id] = lastMatch.match_id;
        await saveMatchHistory();

        // load player info
        const playerInfo = await getPlayerProfile(Number(player.id));

        await sendNotifications(playerInfo, lastMatch);
    }
}

async function saveMatchHistory(): Promise<void> {
    await fs.promises.writeFile(MATCH_HISTORY_FILE, JSON.stringify(lastNotifiedPlayerMatchIds, null, 2));
}

async function sendNotifications(player: IPlayer, match: IRecentMatch): Promise<void> {
    for (const matchPoster of matchPosters) {
        await matchPoster.postMatch(player, match);
    }
}

checkMatches()
    .then(() => {
        console.log("✅ Match checking completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ An error occurred while checking matches:", error);
        process.exit(1);
    })
