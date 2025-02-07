import { IPlayer } from "../IPlayer";

export interface IRankChangeNotifier {
    notifyOfRankChange(player: IPlayer, oldRank: number | null, newRank: number): Promise<void>;
}