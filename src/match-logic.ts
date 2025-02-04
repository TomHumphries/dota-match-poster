export function wonMatch(match: {radiant_win: boolean}, isRadiant: boolean): boolean {
    return match.radiant_win && isRadiant || !match.radiant_win && !isRadiant
}

export function isRadiant(player_slot: number): boolean {
    return player_slot <= 127
}