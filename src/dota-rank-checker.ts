import "./env";
import path from "path";

import { OpenDota } from "opendota.js";
import { IRankChangeNotifier } from "./ranks/IRankChangeNotifier";
import { DiscordEmbedRankChangeNotifier } from "./ranks/DiscordRankChangeNotifier";
import { RankImages } from "./ranks/RankImages";
import { RankChangePoster } from "./ranks/RankChangePoster";
import { UserRanksStore } from "./ranks/UserRanksStore";
import { PlayersStore } from "./players/PlayersStore";

// check for the required environment variables
const DISCORD_WEBHOOK_ID = process.env.DISCORD_WEBHOOK_ID;
if (!DISCORD_WEBHOOK_ID) throw new Error("DISCORD_WEBHOOK_ID is required");
const DISCORD_WEBHOOK_TOKEN = process.env.DISCORD_WEBHOOK_TOKEN;
if (!DISCORD_WEBHOOK_TOKEN) throw new Error("DISCORD_WEBHOOK_TOKEN is required");

// prepare the required class instances
const rankImage = new RankImages(path.join(__dirname, "../assets/ranks"));
const userRanksStore = new UserRanksStore(path.join(__dirname, "../user-ranks.json"));
const openDotaClient = new OpenDota();
const rankChangeNotifiers: IRankChangeNotifier[] = [
    new DiscordEmbedRankChangeNotifier(DISCORD_WEBHOOK_ID, DISCORD_WEBHOOK_TOKEN, rankImage),
]
const rankChangePoster = new RankChangePoster(userRanksStore, openDotaClient, rankChangeNotifiers);
const playersSource = new PlayersStore(path.join(__dirname, "../players.json"));

// check for rank changes for all players
async function checkForRankChanges(): Promise<void> {
    const players = await playersSource.loadPlayers();

    for (const player of players) {
        await rankChangePoster.checkUserForRankChange(player.id);
    }
}

checkForRankChanges()
    .then(() => {
        console.log("✅ Rank change checking completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ An error occurred while checking for rank changes:", error);
        process.exit(1);
    })
