import type { GamePlayerRow, GameRow, RoundResultRow, RoundRow } from "./dbTypes";

export interface Player {
    id: string;
    name: string;
    photoPath: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export type Game = GameRow & {
    players: GamePlayer[],
    rounds: Round[];
};

/**
 * GamePlayer object
 * @seatNumber 0 indexed, where 0 is the dealer in the first round
 */
export type GamePlayer = GamePlayerRow

/**
 * A Round object
 * @roundNumber 0 indexed, where 0 is the first round in the game
 */
export type Round = RoundRow & {
    roundResults: RoundResult[]
}

export type RoundResult = RoundResultRow

/** Allowed values for trumps */
export enum Trump {
    Hearts = 'H',
    Spades = 'S',
    Diamonds = 'D',
    Clubs = 'C',
    None = 'N',
}

/** Possible phases for a Game */
export enum GamePhase {
    InProgress = "inProgress",
    Finished = "finished",
}

/** Possible phases for a Round */
export enum RoundPhase {
    Predicting = "predicting",
    Playing = "playing",
    Scoring = "scoring",
    Finished = "finished",
}

/** RoundSetup object to hold cardsDealt and trump for a round */
export type RoundSetup = {
    cardsDealt: number,
    trump: Trump
}