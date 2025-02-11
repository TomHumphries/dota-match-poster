import fs from "fs";
import path from "path";

export class PlayerMatchHistoryStore {

    constructor(
        private filepath: string,
    ) {}

    public async getLastMatchId(playerId: string): Promise<number | null> {
        const history = await this.loadPlayerMatchHistory();
        return history[playerId] ?? null;
    }

    public async saveLastMatchId(playerId: string, matchId: number): Promise<void> {
        const history = await this.loadPlayerMatchHistory();
        history[playerId] = matchId;
        await this.savePlayerMatchHistory(history);
    }

    private async loadPlayerMatchHistory(): Promise<Record<string, number>> {
        try {
            const content = await fs.promises.readFile(this.filepath, "utf8");
            return JSON.parse(content);
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return {};
            }
            throw error;
        }
    }

    private async savePlayerMatchHistory(history: Record<string, number>): Promise<void> {
        await fs.promises.mkdir(path.dirname(this.filepath), { recursive: true });
        await fs.promises.writeFile(this.filepath, JSON.stringify(history, null, 2), "utf8");
    }
}