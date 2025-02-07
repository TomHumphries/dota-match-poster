import path from "path";
import { DotaRank } from "./DotaRank";

export class RankImages {
    constructor(
        private directory: string,
    ) {}

    getRankImageFilepath(rankTier: number): string {
        const rankCodeStr = rankTier.toString();
        if (rankCodeStr.length !== 2) {
            throw new Error("Invalid rank code. Rank code must be 2 characters long.");
        }

        const level = DotaRank.getLevelFromRankTier(rankTier);
        const rankName = DotaRank.getNameFromLevel(level);
        const stars = DotaRank.getStarsFromRankTier(rankTier);

        return path.join(this.directory, `dota-2-rank-${rankName}-${stars}.png`);
    }
}

