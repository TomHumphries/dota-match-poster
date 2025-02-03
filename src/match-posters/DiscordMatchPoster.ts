import axios from "axios";
import { IDotaPoster } from "./DotaPoster";
import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { IHero } from "../IHero";

export class DiscordMatchPoster implements IDotaPoster {
    constructor(
        private readonly webhookUrl: string,
        private readonly heroes: Record<string, IHero>,
    ) {}

    async postMatch(player: IPlayer, match: IRecentMatch): Promise<void> {
        const message = this.buildMessage(player, match);
        try {
            await this.postMessage(message);
        } catch (error) {
            console.error("❌ Error sending Discord notification:", (error as Error).message);
        }
    }

    private postMessage(message: string): Promise<void> {
        return axios.post(this.webhookUrl, { content: message });
    }

    private buildMessage(player: IPlayer, match: IRecentMatch): string {
        const hero = this.heroes[match.hero_id.toString()];
        const isRadiant = match.player_slot <= 127;
        const won = match.radiant_win && isRadiant || !match.radiant_win && !isRadiant;
        return `🏆 **${player.profile.personaname} ${won ? "won" : "lost"} a match**  
👤 **Hero:** ${hero.localized_name}  
📄 **Match ID:** ${match.match_id}  
🔥 **K/D/A:** ${match.kills}/${match.deaths}/${match.assists}  
⌛ **Duration:** ${Math.floor(match.duration / 60)} min  
🔗 [Stratz](https://stratz.com/matches/${match.match_id})  
🔗 [Dotabuff](https://www.dotabuff.com/matches/${match.match_id})
🔗 [json](https://www.opendota.com/api/matches/${match.match_id})`;
    }
    
}