import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { IHero } from "../IHero";
import { EmbedBuilder } from "discord.js";
import { isRadiant, isRanked, wonMatch } from "../match-logic";

export class PlayerMatchEmbedBuilder {

    constructor(
        private readonly heroes: Record<string, IHero>,
    ) {}

    public buildEmbed(player: IPlayer, match: IRecentMatch, recentMatches: IRecentMatch[]): EmbedBuilder {
        const hero = this.heroes[match.hero_id.toString()];
        const radiant = isRadiant(match.player_slot);
        const won = wonMatch(match, radiant);

        const icon = won ? '🥇' : '🥈';

        const matchType = isRanked(match.lobby_type) ? "a ranked" : "an unranked";
        
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
                { name: 'Duration', value: `${Math.floor(match.duration / 60)}m (<t:${match.start_time}:t> - <t:${match.start_time + match.duration}:t> <t:${match.start_time}:d>)`, inline: false },
                
                { name: `Last ${recentMatchLimit} matches`, value: matchLinks.join(''), inline: false },

                { name: "Links", value: `[Stratz](https://stratz.com/matches/${match.match_id}) | [Dotabuff](https://www.dotabuff.com/matches/${match.match_id}) | [json](https://www.opendota.com/api/matches/${match.match_id})`, inline: true },
            )
            .setThumbnail(`https://cdn.cloudflare.steamstatic.com${hero.img}`)
            .setColor(won ? 3066993 : 15158332) // Green for win, red for loss

        return embed;
    }

}