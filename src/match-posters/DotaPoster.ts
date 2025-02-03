import { IPlayer } from "../IPlayer";
import { IRecentMatch } from "./IRecentMatch";

export interface IDotaPoster {
    postMatch(player: IPlayer, match: IRecentMatch): Promise<void>;
}