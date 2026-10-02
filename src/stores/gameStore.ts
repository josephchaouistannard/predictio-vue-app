import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getGames, getGameById, addOrUpdateGame, deleteGameById } from '@/db/gameService'
import { GamePhase, RoundPhase, type Game, type GamePlayer, type Player, type Round, type RoundResult, type RoundSetup } from '@/types/appTypes'
import { pointsForPrediction, pointsPerTrickWon } from '@/types/constants'

export const useGameStore = defineStore('gameStore', () => {
    const isInitialised = ref(false)
    async function initialise() {
        if (isInitialised.value) return

        await loadGames()
        isInitialised.value = true
    }

    async function loadGames() {
        games.value = await getGames()
    }


    const games = ref<Game[]>([])
    const gameInProgress = computed(() => {
        return games.value.find((g) => (g.phase === GamePhase.InProgress) && (!g.deletedAt))
    })

    /**
     * Creates new nested game object, writes it to the database, and refreshes games list.
     * @param roundSetup 
     * @param selectedPlayers 
     */
    async function startNewGame(roundSetup: RoundSetup[], selectedPlayers: Player[], gameId: string) {

        // Turn Player[] into GamePlayer[]
        const gamePlayers: GamePlayer[] = []
        selectedPlayers.forEach((p, index) => {
            const gamePlayer: GamePlayer = {
                id: crypto.randomUUID(),
                gameId: gameId,
                playerId: p.id,
                seatNumber: index,
                gameScore: 0,
                finalRank: null,
            }
            gamePlayers.push(gamePlayer)
        })
        const nbPlayers = gamePlayers.length

        // Create Round[] from RoundSetup[] (including RoundResult[])
        const rounds: Round[] = []
        roundSetup.forEach((round, index) => {
            const roundId = crypto.randomUUID()
            const roundNumber = index
            const roundResults: RoundResult[] = []
            const dealerSeatNumber = roundNumber % nbPlayers
            let dealerId = null
            gamePlayers.forEach((gamePlayer) => {
                const playPosition = (gamePlayer.seatNumber - dealerSeatNumber + nbPlayers) % nbPlayers
                const isDealer = gamePlayer.seatNumber === dealerSeatNumber
                if (isDealer) {
                    dealerId = gamePlayer.playerId;
                }

                // Create RoundResult[] per player
                roundResults.push({
                    id: crypto.randomUUID(),
                    gameId: gameId,
                    roundId: roundId,
                    playerId: gamePlayer.playerId,
                    playPosition: playPosition,
                    tricksCalled: null,
                    tricksWon: null,
                    scoreEarned: null,
                })
            })
            rounds.push({
                id: roundId,
                gameId: gameId,
                roundNumber: roundNumber,
                cardsDealt: round.cardsDealt,
                trump: round.trump,
                dealerId: dealerId!,
                roundResults: [...roundResults],
                phase: RoundPhase.Predicting,
            })
        })

        // Create Game object
        const game: Game = {
            id: gameId,
            finishedAt: null,
            phase: GamePhase.InProgress,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            rounds: rounds,
            players: gamePlayers,
        }

        await addOrUpdateGame(game)
        await loadGames()
    }

    async function finaliseRound(round: Round) {
        // 1. Look up the specific game this round belongs to using round.gameId
        const game = games.value.find((g) => g.id === round.gameId)
        if (!game) {
            console.error(`Game not found with ID: ${round.gameId}`)
            return
        }

        // 2. Calculate scores and update running totals
        round.roundResults.forEach((res) => {
            const gamePlayer = game.players.find((p) => p.playerId === res.playerId)
            if (!gamePlayer) return

            let roundScore = 0
            const won = res.tricksWon ?? 0
            const called = res.tricksCalled ?? 0

            const predictionBonus = pointsForPrediction ?? 10
            const trickBonus = pointsPerTrickWon ?? 1

            if (won === called) {
                roundScore = predictionBonus + won * trickBonus
            } else {
                roundScore = won * trickBonus
            }

            res.scoreEarned = roundScore
            gamePlayer.gameScore = (gamePlayer.gameScore ?? 0) + roundScore
        })

        // 3. Save the finalized round
        round.phase = RoundPhase.Finished
        const index = game.rounds.findIndex(r => r.id === round.id)
        if (index !== -1) {
            game.rounds[index] = { ...round }
        }

        const allRoundsFinished = game.rounds.every(r => r.phase === RoundPhase.Finished)
        if (allRoundsFinished) {
            // Pass the explicit game ID to finaliseGame
            await finaliseGame(game.id)
        } else {
            // Save the game (automatically stripped of Proxies inside gameService)
            await addOrUpdateGame(game)
            await loadGames()
        }
    }

    async function finaliseGame(gameId: string) {
        // Look up the game from the games array using the passed gameId
        const game = games.value.find((g) => g.id === gameId)
        if (!game) return

        // Mutating these fields is safe because 'game' is a stable, local reference
        game.phase = GamePhase.Finished
        game.finishedAt = new Date().toISOString()

        const rankedPlayers = [...game.players].sort((a, b) => {
            const scoreDifference = b.gameScore - a.gameScore
            if (scoreDifference !== 0) {
                return scoreDifference
            }
            return a.seatNumber - b.seatNumber
        })

        rankedPlayers.forEach((player, index) => {
            const gamePlayer = game.players.find((candidate) => candidate.id === player.id)
            if (!gamePlayer) return

            gamePlayer.finalRank = index
        })

        // Save and reload
        await addOrUpdateGame(game)
        await loadGames()
    }

    async function deleteGameInProgress() {
        if (!gameInProgress.value) { return }
        await deleteGameById(gameInProgress.value?.id)
        await loadGames()
    }

    async function deletePastGame(id: string) {
        await deleteGameById(id)
        await loadGames()
    }

    return {
        initialise,
        games,
        gameInProgress,
        startNewGame,
        finaliseRound,
        deleteGameInProgress,
        deletePastGame,
    }
})
