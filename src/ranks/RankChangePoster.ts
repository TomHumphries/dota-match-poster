import OpenDota from "opendota.js/types/lib/OpenDota";
import { IRankChangeNotifier } from "./IRankChangeNotifier";
import { UserRanksStore } from "./UserRanksStore";
import { IPlayer } from "../IPlayer";

export class RankChangePoster {
    constructor(
        private currentUserRanks: UserRanksStore,
        private openDota: OpenDota,
        private notifiers: IRankChangeNotifier[],
    ) {}

    async checkUserForRankChange(accountId: number): Promise<void> {
        const player: IPlayer = await this.openDota.getPlayer(accountId);
        const oldRank = await this.currentUserRanks.getUserRank(accountId);
        const newRank = player.rank_tier;
        if (!newRank) return;

        if (oldRank !== newRank) {
            // save first to avoid infinite notifications
            await this.currentUserRanks.saveUserRank(accountId, newRank);

            for (const notifier of this.notifiers) {
                await notifier.notifyOfRankChange(player, oldRank, newRank);
            }
        }
    }
    
}