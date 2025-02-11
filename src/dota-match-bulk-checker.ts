import "./env";

import fs from "fs";
import path from "path";

import { IRecentMatch } from "./match-posters/IRecentMatch";
import { PlayerMatchHistoryStore } from "./PlayerMatchHistoryStore";
import { OpenDota } from "opendota.js";
import { EmbedBuilder } from "discord.js";
import { PlayerMatchEmbedBuilder } from "./match-posters/PlayerMatchEmbedBuilder";
import { IHero } from "./IHero";
import axios from "axios";

const openDotaClient = new OpenDota();

const playersFilepath = path.join(__dirname, "../players.json");
const players: {name: string; id: number}[] = JSON.parse(fs.readFileSync(playersFilepath, "utf8"));

const matchHistoryFilepath = path.join(__dirname, "../last_matches.json");
const matchHistoryStore = new PlayerMatchHistoryStore(matchHistoryFilepath);

const MAX_MATCH_AGE_MS = 1000 * 60 * 60 * 3; // 3 hours

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";
if (!DISCORD_WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL is required");

/**
 * Main function to check for new matches and post about them
 */
async function checkMatches(): Promise<void> {
    const heroes: Record<string, IHero> = JSON.parse(fs.readFileSync(path.join(__dirname, "../constants/heroes.json"), "utf8"));

    const playerMatchEmbedBuilder = new PlayerMatchEmbedBuilder(heroes)
    const embeds: EmbedBuilder[] = [];

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

        const playerInfo = await openDotaClient.getPlayer(Number(player.id));
        const embed = playerMatchEmbedBuilder.buildEmbed(playerInfo, lastMatch, recentMatches);
        embeds.push(embed);
        console.log(`Created match embed for player ${player.name} (${player.id})`);
    }
    
    if (embeds.length === 0) {
        console.log("No new matches to report");
        return;
    }
    await axios.post(DISCORD_WEBHOOK_URL, { embeds: embeds });
}

function matchIsTooOld(match: IRecentMatch): boolean {
    // if the match is old (i.e. the script hasn't run for a while), skip it
    const lastMatchTime = new Date(match.start_time * 1000);
    const maxAge = new Date(Date.now() - MAX_MATCH_AGE_MS);
    return (lastMatchTime.valueOf() < maxAge.valueOf());
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
