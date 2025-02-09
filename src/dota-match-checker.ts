import "./env";

import fs from "fs";
import path from "path";

import { IPlayer } from "./IPlayer";
import { IRecentMatch } from "./match-posters/IRecentMatch";
import { IDotaPoster } from "./match-posters/DotaPoster";
import { loadMatchPosters } from "./match-posters/MatchPosterLoading";
import { PlayerMatchHistoryStore } from "./PlayerMatchHistoryStore";
import { OpenDota } from "opendota.js";

const openDotaClient = new OpenDota();

export const matchPosters: IDotaPoster[] = loadMatchPosters();

const playersFilepath = path.join(__dirname, "../players.json");
const players: {name: string; id: number}[] = JSON.parse(fs.readFileSync(playersFilepath, "utf8"));

const matchHistoryFilepath = path.join(__dirname, "../last_matches.json");
const matchHistoryStore = new PlayerMatchHistoryStore(matchHistoryFilepath);

const MAX_AGE_MS = 1000 * 60 * 60 * 2; // 2 hours

/**
 * Fetch the most recent match for a player
 */
async function getLastMatch(playerId: string): Promise<IRecentMatch | null> {
    try {
        const matches: IRecentMatch[] = await openDotaClient.getRecentMatches(Number(playerId));
        const lastMatch = matches[0];
        if (!lastMatch) return null;

        return lastMatch;
    } catch (error) {
        console.error(`❌ Error fetching matches for player ${playerId}:`, (error as Error).message);
        return null;
    }
}

/**
 * Main function to check for new matches and post about them
 */
async function checkMatches(): Promise<void> {
    const lastNotifiedPlayerMatchIds = await matchHistoryStore.loadPlayerMatchHistory();

    for (const player of players) {
        // get the most recent match for the player
        const lastMatch = await getLastMatch(player.id.toString());
        if (!lastMatch) {
            console.warn(`No match found for player ${player.name}`);
            continue;
        }

        if (matchIsTooOld(lastMatch)) continue;
        if (matchAlreadyPosted(player.id, lastMatch.match_id, lastNotifiedPlayerMatchIds)) continue;
        
        // Save updated match history for each user in case of an early exit
        lastNotifiedPlayerMatchIds[player.id.toString()] = lastMatch.match_id;
        await matchHistoryStore.savePlayerMatchHistory(lastNotifiedPlayerMatchIds);

        const playerInfo: IPlayer = await openDotaClient.getPlayer(Number(player.id));
        await sendNotifications(playerInfo, lastMatch);
    }
}

function matchIsTooOld(match: IRecentMatch): boolean {
    // if the match is old (i.e. the script hasn't run for a while), skip it
    const lastMatchTime = new Date(match.start_time * 1000);
    const maxAge = new Date(Date.now() - MAX_AGE_MS);
    return (lastMatchTime.valueOf() < maxAge.valueOf());
}

function matchAlreadyPosted(playerId: number, matchId: number, lastNotifiedPlayerMatchIds: Record<string, number>): boolean {
    if (process.env.SKIP_MATCH_ALREADY_POSTED_CHECK=='true') {
        console.log(`SKIP_MATCH_ALREADY_POSTED_CHECK is true`);
        return false;
    } else {
        // if a notification has already been sent for this match, skip it
        const lastCachedMatchId = lastNotifiedPlayerMatchIds[playerId.toString()] ?? null;
        return (matchId === lastCachedMatchId);
    }
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
