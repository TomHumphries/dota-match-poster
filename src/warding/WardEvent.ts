
export interface WardEvent {
  time: number;
  positionX: number;
  positionY: number;
  wardType: 'OBSERVER' | 'SENTRY';
  fromPlayer: number;
  playerDestroyed: number | null;
}