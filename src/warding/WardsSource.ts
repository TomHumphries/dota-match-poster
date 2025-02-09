import axios from "axios";

export class WardsSource {

  constructor(
    private readonly STRATZ_API_KEY: string,
  ) {}
    
    async getWardsByMatchId(matchId: number) {
            const query = `
query {
  match(id: ${matchId}) {
    playbackData {
      wardEvents {
        time
        positionX
        positionY
        wardType
        fromPlayer
        playerDestroyed
      }
    }
  }
}
`
    const response = await axios.post(
      'https://api.stratz.com/graphql',
      { query },
      {
      headers: {
          Authorization: `Bearer ${this.STRATZ_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "STRATZ_API",
      },
      }
    );

    const wardEvents = response.data?.data?.match?.playbackData?.wardEvents || [];
    return wardEvents;
  }
}

export interface WardEvent {
  time: number;
  positionX: number;
  positionY: number;
  wardType: 'OBSERVER' | 'SENTRY';
  fromPlayer: number;
  playerDestroyed: number | null;
}