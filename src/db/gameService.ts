import type { GamePlayerRow, GameRow, RoundResultRow, RoundRow } from "@/types/dbTypes"
import { db } from "./db"
import type { Game } from "@/types/appTypes";

/** Gets all rows from db, hydrates the nested Game object and returns it */
export async function getGames() {
    const [games, rounds, players, results] = await Promise.all([
        db.games.toArray(),
        db.rounds.toArray(),
        db.gamePlayers.toArray(),
        db.roundResults.toArray(),
    ]);

    return hydrateGames(games, rounds, players, results).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getGameById(gameId: string) {
    const game = await db.games.get(gameId);
    if (!game) return undefined;

    const rounds = await db.rounds.where('gameId').equals(gameId).toArray();
    const players = await db.gamePlayers.where('gameId').equals(gameId).toArray();

    const roundIds = rounds.map(r => r.id);
    const results =
        roundIds.length === 0
            ? []
            : await db.roundResults.where('roundId').anyOf(roundIds).toArray();

    return hydrateGames([game], rounds, players, results)[0];
}

export async function addOrUpdateGame(game: Game) {
    const plainGame = JSON.parse(JSON.stringify(game))
    const { gameRow, roundRows, gamePlayerRows, roundResultsRows } = dehydrateGame(plainGame)
    await db.games.put(gameRow)
    roundRows.forEach(async (r) => {
        await db.rounds.put(r)
    })
    gamePlayerRows.forEach(async (gp) => {
        await db.gamePlayers.put(gp)
    })
    roundResultsRows.forEach(async (rr) => {
        await db.roundResults.put(rr)
    })
}

export async function deleteGameById(id: string) {
    await db.transaction(
        'rw',
        db.games,
        db.gamePlayers,
        db.rounds,
        db.roundResults,
        async () => {
            await db.games.delete(id);
            await db.gamePlayers.where('gameId').equals(id).delete();
            await db.rounds.where('gameId').equals(id).delete();
            await db.roundResults.where('gameId').equals(id).delete();
        }
    );
}

function hydrateGames(
    games: GameRow[],
    rounds: RoundRow[],
    gamePlayers: GamePlayerRow[],
    roundResults: RoundResultRow[]
) {
    const resultsByRoundId = new Map<string, RoundResultRow[]>();

    for (const result of roundResults) {
        const list = resultsByRoundId.get(result.roundId) ?? [];
        list.push(result);
        resultsByRoundId.set(result.roundId, list);
    }

    const hydratedRounds = rounds.map(round => ({
        ...round,
        roundResults: (resultsByRoundId.get(round.id) ?? [])
            .sort((a, b) => a.playPosition - b.playPosition),
    })).sort((a, b) => a.roundNumber - b.roundNumber)

    const roundsByGameId = new Map<string, typeof hydratedRounds>();

    for (const round of hydratedRounds) {
        const list = roundsByGameId.get(round.gameId) ?? [];
        list.push(round);
        roundsByGameId.set(round.gameId, list);
    }

    const playersByGameId = new Map<string, GamePlayerRow[]>();

    for (const player of gamePlayers) {
        const list = playersByGameId.get(player.gameId) ?? [];
        list.push(player);
        playersByGameId.set(player.gameId, list);
    }

    return games.map(game => ({
        ...game,
        rounds: roundsByGameId.get(game.id) ?? [],
        players: (playersByGameId.get(game.id) ?? []).sort((a, b) => a.seatNumber - b.seatNumber),
    }));
}


/**
 * Takes a Game object and returns GameRow, RoundRows, GamePlayerRows, RoundResultsRows
 * @param game app type Game object
 * @returns 
 */
function dehydrateGame(game: Game) {
    const { rounds, players, ...gameRow } = game;

    const roundRows: RoundRow[] = [];
    const roundResultRows: RoundResultRow[] = [];

    for (const round of rounds) {
        const { roundResults, ...roundRow } = round;

        roundRows.push(roundRow);
        roundResultRows.push(...roundResults);
    }

    return {
        gameRow: gameRow,
        roundRows: roundRows,
        gamePlayerRows: players,
        roundResultsRows: roundResultRows,
    };
}
