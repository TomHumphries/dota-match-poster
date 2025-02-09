import path from "path";
import fs from "fs";

import { EmbedBuilder, WebhookClient } from "discord.js";
import { WardMapper } from "./WardMapper";
import { WardsSource } from "./WardsSource";
import OpenDota from "opendota.js/types/lib/OpenDota";

export class WardMapPoster {
    
    constructor(
        private readonly webhookId: string,
        private readonly webhookToken: string,
        private readonly wardsSource: WardsSource,
        private readonly openDotaClient: OpenDota,
        private readonly wardMapper: WardMapper,
        private readonly wardMapsDirectory: string,
    ) {}

    async postWardMap(matchId: number): Promise<void> {
        const match = await this.openDotaClient.getMatch(matchId);
        const wards = await this.wardsSource.getWardsByMatchId(matchId);
        const wardMap = await this.wardMapper.buildMap(wards);
        const wardMapFilepath = await this.saveWardMap(wardMap, matchId);


        const embed = new EmbedBuilder()
            .setTitle(`Ward Map for match ${matchId}`)
            .addFields([
                { name: 'Radiant', inline: true, value: match.players.filter((x: any) => x.isRadiant).map((x: any) => x.personaname).join('  \r\n') },
                { name: 'Dire', inline: true, value: match.players.filter((x: any) => !x.isRadiant).map((x: any) => x.personaname).join('  \r\n') }
            ])
            .setImage(`attachment://${path.basename(wardMapFilepath)}`)
        
        const files = [
            {
                attachment: wardMapFilepath,
                name: path.basename(wardMapFilepath)
            }
        ]
                
        await this.postMessage(embed, files);

    }

    private async saveWardMap(wardMap: Buffer, matchId: number): Promise<string> {
        await fs.promises.mkdir(this.wardMapsDirectory, { recursive: true });
        const filepath = path.join(this.wardMapsDirectory, `${matchId}.png`);
        await fs.promises.writeFile(filepath, wardMap);
        return filepath;
    }

    private async postMessage(embed: EmbedBuilder, files: {attachment: string; name: string}[]): Promise<void> {
        const webhookClient = new WebhookClient({ id: this.webhookId, token: this.webhookToken });
        await webhookClient.send({ embeds: [embed], files: files });
    }

}