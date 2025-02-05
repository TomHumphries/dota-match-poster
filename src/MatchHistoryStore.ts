import fs from "fs";
import path from "path";

export class MatchHistoryStore {

    constructor(
        private filepath: string,
    ) {}

    /**
     * Load the last reported matches for each player
     */
    public async loadMatchHistory(): Promise<Record<string, number>> {
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

    public async saveMatchHistory(history: Record<string, number>): Promise<void> {
        await fs.promises.mkdir(path.dirname(this.filepath), { recursive: true });
        await fs.promises.writeFile(this.filepath, JSON.stringify(history, null, 2), "utf8");
    }
}