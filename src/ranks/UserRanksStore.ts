import fs from "fs";
import path from "path";

export class UserRanksStore {
    constructor(
        private readonly filepath: string,
    ) {}

    public async getUserRank(accountId: number): Promise<number | null> {
        const history = await this.loadUserRanks();
        return history[accountId] ?? null;
    }

    public async saveUserRank(accountId: number, rank: number): Promise<void> {
        const userRanks = await this.loadUserRanks();
        userRanks[accountId] = rank;
        await this.saveUserRanks(userRanks);
    }

    public async saveUserRanks(userRanks: Record<string, number>): Promise<void> {
        await fs.promises.mkdir(path.dirname(this.filepath), { recursive: true });
        await fs.promises.writeFile(this.filepath, JSON.stringify(userRanks, null, 2), "utf8");
    }

    private async loadUserRanks(): Promise<Record<string, number>> {
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
}