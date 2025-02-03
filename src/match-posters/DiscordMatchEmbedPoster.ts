import axios from "axios";
import { IDotaPoster } from "./DotaPoster";
import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { IHero } from "../IHero";
import { EmbedBuilder } from "discord.js";

export class DiscordMatchEmbedPoster implements IDotaPoster {
    constructor(
        private readonly webhookUrl: string,
        private readonly heroes: Record<string, IHero>,
    ) {}

    async postMatch(player: IPlayer, match: IRecentMatch): Promise<void> {
        const embed = this.buildEmbed(player, match);
        try {
            await this.postMessage(embed);
        } catch (error) {
            console.error("❌ Error sending Discord notification:", (error as Error).message);
        }
    }

    private postMessage(embed: object): Promise<void> {
        return axios.post(this.webhookUrl, { embeds: [embed] });
    }

    private buildEmbed(player: IPlayer, match: IRecentMatch): EmbedBuilder {
        const hero = this.heroes[match.hero_id.toString()];
        const isRadiant = match.player_slot <= 127;
        const won = match.radiant_win && isRadiant || !match.radiant_win && !isRadiant;

        let icon = won ? '🥇' : '🥈';
        const embed = new EmbedBuilder()
            .setTitle(`${icon} ${player.profile.personaname} ${won ? "won" : "lost"} a match`)
            .addFields(
                { name: "Hero", value: hero.localized_name, inline: true },
                { name: "Gold/min", value: match.gold_per_min.toLocaleString(), inline: true },
                { name: "XP/min", value: match.xp_per_min.toLocaleString(), inline: true },
                { name: "Team", value: isRadiant ? "Radiant" : "Dire", inline: true },
                { name: "K/D/A", value: `${match.kills}/${match.deaths}/${match.assists}`, inline: true },
                { name: "Duration", value: `${Math.floor(match.duration / 60)} min`, inline: true },
                { name: "Links", value: `[Stratz](https://stratz.com/matches/${match.match_id}) | [Dotabuff](https://www.dotabuff.com/matches/${match.match_id}) | [json](https://www.opendota.com/api/matches/${match.match_id})`, inline: true }
            )
            .setThumbnail(`https://cdn.cloudflare.steamstatic.com${hero.img}`)
            .setColor(won ? 3066993 : 15158332); // Green for win, red for loss

        return embed;
    }
}