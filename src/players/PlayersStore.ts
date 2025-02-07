import fs from "fs";

export class PlayersStore {
    constructor(
        private readonly filepath: string,
    ) {}

    public async loadPlayers(): Promise<{id: number}[]> {
        try {
            const content = await fs.promises.readFile(this.filepath, "utf8");
            return JSON.parse(content);
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
}
        