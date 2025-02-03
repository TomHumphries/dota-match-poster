export interface IRecentMatch {
    match_id: number;
    player_slot: number;
    radiant_win: boolean;
    hero_id: number;
    start_time: number;
    duration: number;
    game_mode: number;
    lobby_type: number;
    version: null | number;
    kills: number;
    deaths: number;
    assists: number;
    average_rank: number;
    xp_per_min: number;
    gold_per_min: number;
    hero_damage: number;
    tower_damage: number;
    hero_healing: number;
    last_hits: number;
    lane: null | number;
    lane_role: null | number;
    is_roaming: null | number;
    cluster: number;
    leaver_status: number;
    party_size: null | number;
    hero_variant: number;
}
