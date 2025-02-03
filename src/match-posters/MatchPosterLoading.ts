import fs from "fs";
import path from "path";

import { ConsoleMatchPoster } from "./ConsoleMatchPoster";
import { DiscordMatchEmbedPoster } from "./DiscordMatchEmbedPoster";
import { IDotaPoster } from "./DotaPoster";
import { IHero } from "../IHero";

export function loadMatchPosters(): IDotaPoster[] {
    
    // constant reference data
    const heroes: Record<string, IHero> = JSON.parse(fs.readFileSync(path.join(__dirname, "../../constants/heroes.json"), "utf8"));
    
    const matchPosters: IDotaPoster[] = [];
    
    if (process.env.POST_TO_CONSOLE == 'true') {
        console.log("Console logging of matches is enabled");
        matchPosters.push(new ConsoleMatchPoster(heroes));
    }
    
    if (process.env.POST_TO_DISCORD == 'true') {
        const DISCORD_WEBHOOK_URL: string = process.env.DISCORD_WEBHOOK_URL ?? "";
        if (!DISCORD_WEBHOOK_URL) {
            console.warn("POST_TO_DISCORD is true but the Discord Webhook URL is missing in the .env file. Discord notifications will be disabled.");
        } else {
            console.log("Discord notifications are enabled");
            matchPosters.push(new DiscordMatchEmbedPoster(DISCORD_WEBHOOK_URL, heroes));
        }
    }

    return matchPosters;
}