export class DotaRank {

    private static readonly _ranks: Record<number, string> = {
        1: "herald",
        2: "guardian",
        3: "crusader",
        4: "archon",
        5: "legend",
        6: "ancient",
        7: "divine",
        8: "immortal",
    };

    static getNameFromLevel(level: number): string {
        const rank = this._ranks[level];
        if (!rank) throw new Error("Invalid rank level");
        return rank;
    }

    static getNameFromRankTier(rankTier: number): string {
        const level = this.getLevelFromRankTier(rankTier);
        return this.getNameFromLevel(level);
    }

    static getRankDescription(rankTier: number): string {
        const level = this.getLevelFromRankTier(rankTier);
        if (level === 8) return "Immortal";

        const rankName = this.getNameFromLevel(level);
        const stars = this.getStarsFromRankTier(rankTier);
        
        const rankDescription = `${rankName.charAt(0).toUpperCase() + rankName.slice(1)} ${stars}`;
        return rankDescription;
    }

    static getLevelFromRankTier(rankTier: number): number {
        const rankTierStr = rankTier.toString();
        if (rankTierStr.length !== 2) throw new Error("Invalid rank tier. Must be 2 characters long.");

        const level = parseInt(rankTierStr[0]);
        if (level < 1 || level > 8) {
            throw new Error(`Invalid rank code. First character must be between 1 and 8. Got ${level}.`);
        }
        return level;
    }

    static getStarsFromRankTier(rankTier: number): number {
        const rankTierStr = rankTier.toString();
        if (rankTierStr.length !== 2) throw new Error("Invalid rank tier");
        const stars = parseInt(rankTierStr[1]);
        if (stars < 0 || stars > 5) {
            throw new Error(`Invalid rank code. Second character must be between 0 and 5. Got ${stars}.`);
        }
        return stars;
    }

    static get ranks(): { level: number; name: string; }[] {
        return Object.entries(this._ranks).map(([level, name]) => ({ level: parseInt(level), name }));
    }
}
