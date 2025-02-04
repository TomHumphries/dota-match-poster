import { IDotaPoster } from "./DotaPoster";
import { IHero } from "../IHero";
import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { isRadiant, wonMatch } from "../match-logic";

export class ConsoleMatchPoster implements IDotaPoster {

    constructor(
        private readonly heroes: Record<string, IHero>,
    ) {}

    async postMatch(player: IPlayer, match: IRecentMatch): Promise<void> {
        const hero = this.heroes[match.hero_id.toString()];
        const radiant = isRadiant(match.player_slot);
        const won = wonMatch(match, radiant);
        console.log(``);
        const icon = won ? "🥇" : "🥈";
        console.log(`${icon} ${player.profile.personaname} ${won ? "won" : "lost"} a match`);
        console.log(`Hero: ${hero.localized_name}`);
        console.log(`Team: ${radiant ? "Radiant" : "Dire"}`);
        console.log(`Winning team: ${match.radiant_win ? "Radiant" : "Dire"}`);
        console.log(`Duration: ${Math.floor(match.duration / 60)} min`);
        console.log(`K/D/A: ${match.kills}/${match.deaths}/${match.assists}`);
        console.log(`https://www.opendota.com/matches/${match.match_id}`);
        console.log(``);
    }
    
}