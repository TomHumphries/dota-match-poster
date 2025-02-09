import path from "path";
import fs from "fs";

import { EmbedBuilder, WebhookClient } from "discord.js";
import { WardMapper } from "./WardMapper";
import axios, { AxiosInstance } from "axios";

export class WardMapPoster {
    
    private axiosInstance: AxiosInstance;

    constructor(
        private readonly webhookId: string,
        private readonly webhookToken: string,
        STRATZ_API_KEY: string,
        private readonly wardMapper: WardMapper,
        private readonly wardMapsDirectory: string,
    ) {
        this.axiosInstance = axios.create({
            baseURL: 'https://api.stratz.com',
            headers: {
                Authorization: `Bearer ${STRATZ_API_KEY}`,
                "Content-Type": "application/json",
                "User-Agent": "STRATZ_API",
            },
        })
    }

    async postWardMap(matchId: number): Promise<void> {
        const data = await this.getMatchInfo(matchId);

        const wards = data.match.playbackData.wardEvents;
        if (wards.length === 0) {
            console.log(`Match ${matchId} has no ward data`);
            return;
        }

        const wardMap = await this.wardMapper.buildMap(wards);
        const wardMapFilepath = await this.saveWardMap(wardMap, matchId);
        
        const radiantPlayers = data.match.players.filter((x: any) => x.isRadiant);
        const radiantKills = radiantPlayers.reduce((acc: number, x: any) => acc + x.kills, 0);
        const radiantTitle = `\`${radiantKills.toString().padStart(2, ' ')}\` Radiant${data.match.didRadiantWin ? ' 🥇' : ''}`;
        const radiantValue = radiantPlayers.map((x: any) => this.makePlayerScoreboardLine(x)).join('  \r\n');

        const direPlayers = data.match.players.filter((x: any) => !x.isRadiant);
        const direKills = direPlayers.reduce((acc: number, x: any) => acc + x.kills, 0);
        const direTitle = `\`${direKills.toString().padStart(2, ' ')}\` Dire${!data.match.didRadiantWin ? ' 🥇' : ''}`;
        const direValue = direPlayers.map((x: any) => this.makePlayerScoreboardLine(x)).join('  \r\n');

        const embed = new EmbedBuilder()
            .setTitle(`Match \`${matchId}\``)
            .addFields([
                { name: 'Duration', value: `${Math.floor(data.match.durationSeconds / 60)}m (<t:${data.match.startDateTime}:t> - <t:${data.match.endDateTime}:t> <t:${data.match.endDateTime}:d>)`, inline: false },
                { name: radiantTitle, inline: true, value: radiantValue },
                { name: direTitle, inline: true, value: direValue }
            ])
            .setImage(`attachment://${path.basename(wardMapFilepath)}`)
            .setColor('#fbf97b')
            .setFooter({text: 'Ward Map generated from Stratz data'});
        
        const files = [
            {
                attachment: wardMapFilepath,
                name: path.basename(wardMapFilepath)
            }
        ]
                
        await this.postDiscordEmbed(embed, files);
        await this.deleteWardMap(wardMapFilepath);
    }

    private makePlayerScoreboardLine(player: any): string {
        const kills = player.kills.toString().padStart(2, ' ');
        const deaths = player.deaths.toString().padStart(2, ' ');
        const assists = player.assists.toString().padStart(2, ' ');
        const name = player.steamAccount.name ?? '_Unknown_';
        return `\`${kills}/${deaths}/${assists}\` ${name}`;
    }

    private async saveWardMap(wardMap: Buffer, matchId: number): Promise<string> {
        await fs.promises.mkdir(this.wardMapsDirectory, { recursive: true });
        const filepath = path.join(this.wardMapsDirectory, `${matchId}.png`);
        await fs.promises.writeFile(filepath, wardMap);
        return filepath;
    }

    private async deleteWardMap(filepath: string): Promise<void> {
        await fs.promises.unlink(filepath);
    }

    private async postDiscordEmbed(embed: EmbedBuilder, files: {attachment: string; name: string}[]): Promise<void> {
        const webhookClient = new WebhookClient({ id: this.webhookId, token: this.webhookToken });
        await webhookClient.send({ embeds: [embed], files: files });
    }

    private async getMatchInfo(matchId: number) {
        const query = `
{
  match(id: ${matchId}) {
    startDateTime
    endDateTime
    durationSeconds
    didRadiantWin
    players {
      steamAccount {
        name
      }
      isRadiant
      kills
      assists
      deaths
    }
    playbackData {
      wardEvents {
        time
        positionX
        positionY
        wardType
        fromPlayer
        playerDestroyed
      }
    }
  }
}
`
        const response = await this.axiosInstance.post('/graphql', { query }, );
        return response.data.data
    }
}