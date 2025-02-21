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

const MAX_MATCH_AGE_MS = 1000 * 60 * 60 * 3; // 3 hours

/**
 * Main function to check for new matches and post about them
 */
async function checkMatches(): Promise<void> {

    for (const player of players) {
        // get the most recent match for the player
        const recentMatches: IRecentMatch[] = await openDotaClient.getRecentMatches(player.id);
        const lastMatch = recentMatches[0];
        if (!lastMatch) continue;
        if (matchIsTooOld(lastMatch)) continue;
        
        const lastReportedMatchId = await matchHistoryStore.getLastMatchId(player.id.toString());
        if (lastReportedMatchId === lastMatch.match_id) continue;
        
        // save before so we don't spam the same match in case of an error
        await matchHistoryStore.saveLastMatchId(player.id.toString(), lastMatch.match_id);

        const playerInfo: IPlayer = await openDotaClient.getPlayer(Number(player.id));
        await sendNotifications(playerInfo, lastMatch);
    }
}

function matchIsTooOld(match: IRecentMatch): boolean {
    // if the match is old (i.e. the script hasn't run for a while), skip it
    const lastMatchTime = new Date(match.start_time * 1000);
    const maxAge = new Date(Date.now() - MAX_MATCH_AGE_MS);
    return (lastMatchTime.valueOf() < maxAge.valueOf());
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
