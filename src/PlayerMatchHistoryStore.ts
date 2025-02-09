import fs from "fs";
import path from "path";

export class PlayerMatchHistoryStore {

    constructor(
        private filepath: string,
    ) {}

    /**
     * Load the last reported matches for each player
     */
    public async loadPlayerMatchHistory(): Promise<Record<string, number>> {
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

    public async savePlayerMatchHistory(history: Record<string, number>): Promise<void> {
        await fs.promises.mkdir(path.dirname(this.filepath), { recursive: true });
        await fs.promises.writeFile(this.filepath, JSON.stringify(history, null, 2), "utf8");
    }
}