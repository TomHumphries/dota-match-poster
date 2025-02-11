import axios from "axios";
import { IDotaPoster } from "./DotaPoster";
import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";
import { IHero } from "../IHero";
import OpenDota from "opendota.js/types/lib/OpenDota";
import { PlayerMatchEmbedBuilder } from "./PlayerMatchEmbedBuilder";

export class DiscordMatchEmbedPoster implements IDotaPoster {
    constructor(
        private readonly webhookUrl: string,
        private readonly openDota: OpenDota,
        private readonly playerMatchEmbedBuilder: PlayerMatchEmbedBuilder,
    ) {}

    async postMatch(player: IPlayer, match: IRecentMatch): Promise<void> {
        const recentMatches: IRecentMatch[] = await this.openDota.getRecentMatches(player.profile.account_id);
        const embed = this.playerMatchEmbedBuilder.buildEmbed(player, match, recentMatches);
        try {
            await this.postMessage(embed);
        } catch (error) {
            console.error("❌ Error sending Discord notification:", (error as Error).message);
        }
    }

    private postMessage(embed: object): Promise<void> {
        return axios.post(this.webhookUrl, { embeds: [embed] });
    }

}