import { EmbedBuilder, Webhook, WebhookClient } from "discord.js";
import { IPlayer } from "../IPlayer";
import { IRankChangeNotifier } from "./IRankChangeNotifier";
import { RankImages } from "./RankImages";
import { DotaRank } from "./DotaRank";
import path from "path";

export class DiscordEmbedRankChangeNotifier implements IRankChangeNotifier {
    
    constructor(
        private readonly webhookId: string,
        private readonly webhookToken: string,
        private readonly rankImage: RankImages,
    ) {}

    async notifyOfRankChange(player: IPlayer, oldRank: number | null, newRank: number): Promise<void> {
        const filepath = this.rankImage.getRankImageFilepath(newRank);

        const oldRankDesc = oldRank !== null ? DotaRank.getRankDescription(oldRank) : "Unranked";
        const newRankDesc = DotaRank.getRankDescription(newRank);
        
        let title = `${player.profile.personaname} has been ranked`;
        let colour = 0x0000ff; // blue
        let rankDescription = newRankDesc;
        
        if (oldRank === null) {
            title = `${player.profile.personaname} has been ranked`;
            colour = 0x0000ff; // blue

        } else if (oldRank !== null && oldRank < newRank) {
            title = `${player.profile.personaname} has gained rank`;
            colour = 0x00ff00; // green
            rankDescription = `${oldRankDesc} -> ${newRankDesc}`;

        } else if (oldRank !== null && oldRank > newRank) {
            title = `${player.profile.personaname} has dropped rank`;
            colour = 0xff0000; // red
            rankDescription = `${oldRankDesc} -> ${newRankDesc}`;
        } else {
            // unknown rank state
        }
        

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(rankDescription)
            .setImage(`attachment://${path.basename(filepath)}`)
            .setColor(colour)
        
        const files = [
            {
                attachment: filepath,
                name: path.basename(filepath)
            }
        ]
                
        await this.postMessage(embed, files);

    }

    private async postMessage(embed: EmbedBuilder, files: {attachment: string; name: string}[]): Promise<void> {
        const webhookClient = new WebhookClient({ id: this.webhookId, token: this.webhookToken });
        await webhookClient.send({ embeds: [embed], files: files });
    }

}