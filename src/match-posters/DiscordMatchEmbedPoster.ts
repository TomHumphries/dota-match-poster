import axios from "axios";
import { IDotaPoster } from "./DotaPoster";
import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { IHero } from "../IHero";
import { EmbedBuilder } from "discord.js";
import OpenDota from "opendota.js/types/lib/OpenDota";
import { isRadiant, wonMatch } from "../match-logic";

export class DiscordMatchEmbedPoster implements IDotaPoster {
    constructor(
        private readonly webhookUrl: string,
        private readonly heroes: Record<string, IHero>,
        private readonly openDota: OpenDota,
    ) {}

    async postMatch(player: IPlayer, match: IRecentMatch): Promise<void> {
        const recentMatches: IRecentMatch[] = await this.openDota.getRecentMatches(player.profile.account_id);

        const embed = this.buildEmbed(player, match, recentMatches);
        try {
            await this.postMessage(embed);
        } catch (error) {
            console.error("❌ Error sending Discord notification:", (error as Error).message);
        }
    }

    private postMessage(embed: object): Promise<void> {
        return axios.post(this.webhookUrl, { embeds: [embed] });
    }

    private buildEmbed(player: IPlayer, match: IRecentMatch, recentMatches: IRecentMatch[]): EmbedBuilder {
        const hero = this.heroes[match.hero_id.toString()];
        const radiant = isRadiant(match.player_slot);
        const won = wonMatch(match, radiant);

        const icon = won ? '🥇' : '🥈';

        const matchType = match.lobby_type === 1 ? "a ranked" : "an unranked";
        
        const recentMatchLimit = 10;
        const matchLinks = recentMatches.slice(0, recentMatchLimit).map(x => `[${wonMatch(x, isRadiant(x.player_slot)) ? '🟢' : '🔴'}](https://stratz.com/matches/${x.match_id})`);
        matchLinks.reverse();
        const embed = new EmbedBuilder()
            .setTitle(`${icon} ${player.profile.personaname} ${won ? "won" : "lost"} ${matchType} match`)
            .addFields(
                { name: "Hero", value: hero.localized_name, inline: true },
                { name: "Team", value: radiant ? "Radiant" : "Dire", inline: true },
                { name: "K/D/A", value: `${match.kills}/${match.deaths}/${match.assists}`, inline: true },

                { name: "Gold/min", value: match.gold_per_min.toLocaleString(), inline: true },
                { name: "XP/min", value: match.xp_per_min.toLocaleString(), inline: true },
                { name: "Duration", value: `${Math.floor(match.duration / 60)} min`, inline: true },
                
                { name: `Last ${recentMatchLimit} matches`, value: matchLinks.join(''), inline: false },

                { name: "Start time", value: `<t:${match.start_time}:t> <t:${match.start_time}:d>`, inline: false },

                { name: "Links", value: `[Stratz](https://stratz.com/matches/${match.match_id}) | [Dotabuff](https://www.dotabuff.com/matches/${match.match_id}) | [json](https://www.opendota.com/api/matches/${match.match_id})`, inline: true },
            )
            .setThumbnail(`https://cdn.cloudflare.steamstatic.com${hero.img}`)
            .setColor(won ? 3066993 : 15158332) // Green for win, red for loss

        return embed;
    }

}