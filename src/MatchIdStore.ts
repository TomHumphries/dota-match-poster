import fs from "fs";

export class IdStore {
    constructor(
        private readonly filepath: string,
        private maxToStore: number = 100,
    ) {}

    public async hasId(matchId: string): Promise<boolean> {
        const ids = await this.loadIds();
        return ids.includes(matchId);
    }

    public async addId(matchId: string): Promise<void> {
        const ids = await this.loadIds();
        ids.push(matchId);
        await this.saveIds(ids);
    }

    private async saveIds(ids: string[]): Promise<void> {
        const trimmedIds = ids.slice(-this.maxToStore);
        const content = trimmedIds.join("\n");
        await fs.promises.writeFile(this.filepath, content, "utf8");
    }

    private async loadIds(): Promise<string[]> {
        try {
            // one id per line
            const content = await fs.promises.readFile(this.filepath, "utf8");
            return content.split("\n").filter(x => x !== "");
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
}