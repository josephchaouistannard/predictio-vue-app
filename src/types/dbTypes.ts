export interface PlayerRow {
    id: string;
    name: string;
    photoPath: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface GameRow {
    id: string;
    finishedAt: string | null;
    phase: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

/**
 * GamePlayer object
 * @seatNumber 0 indexed, where 0 is the dealer in the first round
 * @finalRank 0 indexed, 0 is winner
 */
export interface GamePlayerRow {
    id: string;
    gameId: string;
    playerId: string;
    seatNumber: number;
    gameScore: number;
    finalRank: number | null;
}

/**
 * A Round object
 * @roundNumber 0 indexed, where 0 is the first round in the game
 */
export interface RoundRow {
    id: string;
    gameId: string;
    roundNumber: number;
    phase: string;
    cardsDealt: number;
    trump: string;
    dealerId: string;
}

export interface RoundResultRow {
    id: string;
    gameId: string;
    roundId: string;
    playerId: string;
    playPosition: number;
    tricksCalled: number | null;
    tricksWon: number | null;
    scoreEarned: number | null;
}