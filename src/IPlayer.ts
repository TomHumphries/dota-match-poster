export interface IPlayer {
    profile: {
      account_id: number;
      personaname: string;
      name: null | string;
      plus: boolean;
      cheese: 0;
      steamid: string;
      avatar: string;
      avatarmedium: string;
      avatarfull: string;
      profileurl: string;
      last_login: null | string;
      loccountrycode: string;
      status: null | string;
      fh_unavailable: boolean;
      is_contributor: boolean;
      is_subscriber: boolean;
    }
    rank_tier: number | null;
    leaderboard_rank: null | string | number;
  }