// db.ts
import type { GamePlayerRow, GameRow, PlayerRow, RoundResultRow, RoundRow } from '@/types/dbTypes';
import { Dexie, type EntityTable } from 'dexie';

// Fixed the casing of the store keys to match standard camelCase
const db = new Dexie('PredictioDatabase') as Dexie & {
    players: EntityTable<PlayerRow, 'id'>;
    games: EntityTable<GameRow, 'id'>;
    gamePlayers: EntityTable<GamePlayerRow, 'id'>;
    rounds: EntityTable<RoundRow, 'id'>;
    roundResults: EntityTable<RoundResultRow, 'id'>;
};

// Schema declaration:
db.version(1).stores({
    players: 'id, isActive, deletedAt',
    games: 'id, phase, deletedAt',
    gamePlayers: 'id, gameId, playerId, [gameId+playerId]',
    rounds: 'id, gameId, [gameId+roundNumber]',
    roundResults: 'id, gameId, roundId, playerId, [roundId+playerId]'
});

export { db };