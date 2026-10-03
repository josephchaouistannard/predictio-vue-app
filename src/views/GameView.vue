<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { GamePhase, RoundPhase, Trump, type RoundSetup } from '@/types/appTypes';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { App } from '@capacitor/app';
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import RoundParams from '@/components/RoundParams.vue';

const router = useRouter()
const route = useRoute()
const gameId = route.params.gameId

const gs = useGameStore()
const ps = usePlayerStore()

const game = computed(() => {
    return gs.games.find((g) => g.id === gameId)
})

const gamePhase = computed(() => game.value?.phase)
const currentRound = computed(() => {
    if (!game.value) return null
    return game.value.rounds
        .filter(r => r.phase !== RoundPhase.Finished)
        .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
})
const roundPhase = computed(() => currentRound.value?.phase)
const roundParams = computed(() => {
    if (!currentRound.value || currentRound.value === null) { return null }
    return {
        cardsDealt: currentRound.value.cardsDealt,
        trump: currentRound.value.trump
    }
})

// Create a highly reactive Map of player IDs to Names.
const playersMap = computed(() => {
    const map = new Map<string, string>()
    ps.players.forEach((p) => {
        map.set(p.id, p.name)
    })
    return map
})

// NEW: Computed property to sort the final standing of players
const sortedPlayers = computed(() => {
    if (!game.value || !game.value.players) return []
    return [...game.value.players].sort((a, b) => {
        if (a.finalRank !== null && b.finalRank !== null) {
            return a.finalRank - b.finalRank
        }
        return (b.gameScore ?? 0) - (a.gameScore ?? 0)
    })
})

const tricksCalled = computed(() => {
    if (!currentRound.value) { return false }
    let total = 0
    for (const r of currentRound.value.roundResults) {
        if (r.tricksCalled === null || typeof r.tricksCalled !== 'number') {
            return false
        }
        total += r.tricksCalled
    }
    return total
})

const callsValid = computed(() => {
    if (!currentRound.value) { return false }

    for (const r of currentRound.value.roundResults) {
        if (r.tricksCalled! > currentRound.value.cardsDealt) {
            return false
        }
    }

    return tricksCalled.value !== currentRound.value.cardsDealt
})

const underOverText = computed(() => {
    if (tricksCalled.value === false || !currentRound.value) {
        return 'Everyone must call'
    }
    const callDiff = tricksCalled.value - currentRound.value.cardsDealt
    if (callDiff === 0) {
        return 'Tricks called cannot be equal to cards dealt'
    } else if (callDiff > 0) {
        return `${callDiff} overcall`
    } else {
        return `${-callDiff} undercall`
    }
})

const wonValid = computed(() => {
    if (!currentRound.value) { return false }

    let total = 0
    for (const r of currentRound.value.roundResults) {
        if (r.tricksWon === null || typeof r.tricksWon !== 'number') {
            return false
        }
        total += r.tricksWon
    }

    return total === currentRound.value.cardsDealt
})

const titleText = computed(() => {
    switch (roundPhase.value) {
        case RoundPhase.Predicting:
            return 'Prediction'
        case RoundPhase.Playing:
            return 'Playing'
        case RoundPhase.Scoring:
            return 'Scoring'
        default:
            return 'Game'
    }
})

async function back() {
    router.push({ name: 'home' })
}

function finalisePredictions() {
    if (!currentRound.value || currentRound.value === null) { return }
    currentRound.value.phase = RoundPhase.Playing
}

function endRound() {
    if (!currentRound.value || currentRound.value === null) { return }
    currentRound.value.phase = RoundPhase.Scoring
}

async function finaliseScores() {
    if (!currentRound.value) { return }
    await gs.finaliseRound(currentRound.value)
}

const getPlayerResult = (round: any, playerId: string) => {
    if (!round || !round.roundResults) return null
    return round.roundResults.find((player: any) => player.playerId === playerId) ?? null
}

onMounted(async () => {
    await ps.initialise()
    await gs.initialise()
    App.addListener('backButton', () => {
        back()
    })
    const keepAwake = async () => {
        await KeepAwake.keepAwake();
    };
    console.log('Keeping awake:', await keepAwake)
})
</script>

<template>
    <div class="app-viewport">
        <header class="app-header">
            <div class="header-bar">
                <button class="icon-button" @click="back" aria-label="Go Back">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 class="header-title">{{ titleText }}</h1>
                <div class="header-right-placeholder" />
            </div>
        </header>

        <main class="scroll-content">
            <div class="content-padding">

                <!-- PHASE 1: PREDICTING -->
                <div v-if="roundPhase === RoundPhase.Predicting" class="predicting-section">
                    <div class="card round-params-card">
                        <h2 class="text-lg">Round summary</h2>
                        <RoundParams :r="roundParams! as RoundSetup" />
                    </div>

                    <div class="list-group player-list">
                        <div class="list-item player-item" v-for="res in currentRound?.roundResults"
                            :class="{ dealer: res.playPosition === 0 }" :key="res.playerId">
                            <div class="player-info-column">
                                <div class="player-name">
                                    {{ playersMap.get(res.playerId) }}
                                    <span v-if="res.playPosition === 0" class="material-symbols-outlined dealer-badge"
                                        title="Dealer">
                                        playing_cards
                                    </span>
                                </div>
                                <div class="list-item-subtitle">
                                    Score: {{game?.players.find((p) => p.playerId === res.playerId)?.gameScore}}
                                </div>
                            </div>
                            <div class="player-actions">
                                <label class="form-label call-label" :for="`call-${res.playerId}`">Tricks</label>
                                <input :id="`call-${res.playerId}`" class="form-input call-input" type="number" min="0"
                                    :max="roundParams?.cardsDealt ?? 0" v-model.number="res.tricksCalled" />
                            </div>
                        </div>
                    </div>
                    <p class="setup-copy text-sm text-muted"
                        :class="{ 'warning-copy': tricksCalled === currentRound?.cardsDealt }">
                        {{ underOverText }}
                    </p>
                </div>

                <!-- PHASE 2: PLAYING -->
                <div v-if="roundPhase === RoundPhase.Playing" class="playing-section">
                    <div class="card reminderCard">
                        <div class="reminder-side">
                            <RoundParams class="playingRoundReminder" :r="roundParams! as RoundSetup" />
                        </div>
                        <div class="divider-v"></div>
                        <div class="reminder-side">
                            <RoundParams class="playingRoundReminder inverted" :r="roundParams! as RoundSetup" />
                        </div>
                    </div>

                    <p class="setup-copy" style="font-size: 2rem;">{{ underOverText }}</p>
                    <div class="list-group player-list">
                        <div class="list-item player-item" v-for="res in currentRound?.roundResults"
                            :class="{ dealer: res.playPosition === 0 }" :key="res.playerId">
                            <div class="player-info-column">
                                <div class="player-name">
                                    {{ playersMap.get(res.playerId) }}
                                    <span v-if="res.playPosition === 0" class="material-symbols-outlined dealer-badge"
                                        title="Dealer">
                                        playing_cards
                                    </span>
                                </div>
                                <div class="list-item-subtitle">
                                    Score: {{game?.players.find((p) => p.playerId === res.playerId)?.gameScore}}
                                </div>
                            </div>
                            <div class="player-actions">
                                <label class="form-label call-label">Call</label>
                                <p class="static-value">{{ res.tricksCalled }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PHASE 3: SCORING -->
                <div v-if="roundPhase === RoundPhase.Scoring" class="scoring-section">
                    <div class="list-group player-list">
                        <div class="list-item player-item" v-for="res in currentRound?.roundResults"
                            :class="{ dealer: res.playPosition === 0 }" :key="res.playerId">
                            <div class="player-info-column">
                                <div class="player-name">
                                    {{ playersMap.get(res.playerId) }}
                                    <span v-if="res.playPosition === 0" class="material-symbols-outlined dealer-badge"
                                        title="Dealer">
                                        playing_cards
                                    </span>
                                </div>
                                <div class="list-item-subtitle">
                                    Score: {{game?.players.find((p) => p.playerId === res.playerId)?.gameScore}}
                                </div>
                            </div>
                            <div class="score-input-group">
                                <div class="player-actions align-center">
                                    <span class="form-label call-label">Called</span>
                                    <p class="static-value">{{ res.tricksCalled }}</p>
                                </div>
                                <div class="divider-v-sm"></div>
                                <div class="player-actions">
                                    <label class="form-label call-label" :for="`won-${res.playerId}`">Won</label>
                                    <input :id="`won-${res.playerId}`" class="form-input call-input" type="number"
                                        min="0" :max="roundParams?.cardsDealt ?? 0" v-model.number="res.tricksWon" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SCOREBOARD TABLE & FINAL STANDINGS (Shows when game is finished/not in progress) -->
                <template v-if="game?.phase !== GamePhase.InProgress">
                    <div class="table-shell">
                        <table>
                            <thead>
                                <tr>
                                    <th class="round-header">Round</th>
                                    <th v-for="p in game?.players" :key="p.id" colspan="2" class="player-header">
                                        <span class="player-name-th">{{ playersMap.get(p.playerId) }}</span>
                                    </th>
                                </tr>
                                <tr class="sub-header">
                                    <th class="round-header round-spacer-th"></th>
                                    <template v-for="p in game?.players" :key="`${p.id}-sub`">
                                        <th class="sub-column score-header">Score</th>
                                        <th class="sub-column tricks-header">Call</th>
                                    </template>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(r, index) in game?.rounds" :key="index">
                                    <td class="round-cell">
                                        <div class="round-meta">
                                            <RoundParams class="small-scale"
                                                :r="{ cardsDealt: r.cardsDealt, trump: r.trump as Trump }" />
                                        </div>
                                    </td>
                                    <template v-for="p in game?.players" :key="p.id">
                                        <td class="score-cell">
                                            {{ getPlayerResult(r, p.playerId)?.scoreEarned ?? 0 }}
                                        </td>
                                        <td class="tricks-cell">
                                            {{ getPlayerResult(r, p.playerId)?.tricksCalled ?? 0 }}
                                        </td>
                                    </template>
                                </tr>
                                <tr class="sub-header sticky-bottom-row-label">
                                    <th class="round-header footer-spacer"></th>
                                    <template v-for="p in game?.players" :key="`${p.id}-sub`">
                                        <th class="sub-column score-header">Score</th>
                                        <th class="sub-column tricks-header">Place</th>
                                    </template>
                                </tr>
                                <tr class="total-row">
                                    <th class="round-header total-label-cell">
                                        <span class="total-label">Total</span>
                                    </th>
                                    <template v-for="p in game?.players" :key="p.id">
                                        <td class="score-cell total-score">
                                            {{ p.gameScore ? p.gameScore : '-' }}
                                        </td>
                                        <td class="tricks-cell total-place">
                                            {{ p.finalRank !== null ? p.finalRank + 1 : '-' }}
                                        </td>
                                    </template>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- NEW: Final Standings/Podium list right below the table -->
                    <div class="standings-section">
                        <h3 class="section-title">Final Standings</h3>
                        <div class="standings-list">
                            <div v-for="(p, index) in sortedPlayers" :key="p.playerId" class="standing-card"
                                :class="{ 'winner-card': p.finalRank === 0 || index === 0 }">
                                <div class="standing-info">
                                    <span class="standing-rank" :class="`rank-${p.finalRank ?? index}`">
                                        {{ p.finalRank !== null ? p.finalRank + 1 : index + 1 }}
                                    </span>
                                    <span class="standing-player-name">{{ playersMap.get(p.playerId) }}</span>
                                </div>
                                <div class="standing-score-badge">
                                    {{ p.gameScore ?? 0 }} pts
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

            </div>
        </main>

        <footer class="app-footer">
            <button class="btn btn-primary" type="button" v-if="roundPhase === RoundPhase.Predicting"
                :disabled="!callsValid" @click="finalisePredictions">Play</button>
            <button class="btn btn-primary" type="button" v-if="roundPhase === RoundPhase.Playing" @click="endRound">End
                Round</button>
            <button class="btn btn-primary" type="button" v-if="roundPhase === RoundPhase.Scoring"
                @click="finaliseScores" :disabled="!wonValid">Save scores</button>
        </footer>
    </div>
</template>

<style scoped>
/* ==========================================
   PAGE LAYOUT STRUCTURE
   ========================================== */
.app-viewport {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    background-color: #f8fafc;
}

.app-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px 16px;
}

.header-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
}

.header-title {
    font-size: 1.15rem;
    font-weight: 700;
    text-align: center;
    margin: 0;
    color: #0f172a;
}

.icon-button {
    background: none;
    border: none;
    color: #0f172a;
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.icon-button:active {
    background-color: #f1f5f9;
}

.scroll-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.content-padding {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}


/* ==========================================
   PHASE SECTIONS & CARDS
   ========================================== */
.predicting-section,
.playing-section,
.scoring-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.text-lg {
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin: 0 0 10px 0;
}

/* CENTER OF TABLE DUAL-VIEW CARD */
.reminderCard {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 8px;
    background-color: #ffffff;
}

.reminder-side {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.divider-v {
    width: 1px;
    height: 40px;
    background-color: #e2e8f0;
}

.inverted {
    transform: rotate(180deg);
}

.playingRoundReminder {
    transform: scale(1.5);
}

.playingRoundReminder.inverted {
    transform: rotate(180deg) scale(1.5);
}

/* ==========================================
   LISTS & ALIGNMENT
   ========================================== */
.player-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.player-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}

.player-item.dealer {
    order: 1;
    border-left: 4px solid #f59e0b;
}

.player-info-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.player-name {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
}

.dealer-badge {
    font-size: 18px;
    color: #ef4444;
}

.list-item-subtitle {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}

/* ==========================================
   INPUTS & SCORING GROUPS
   ========================================== */
.score-input-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.divider-v-sm {
    width: 1px;
    height: 30px;
    background-color: #e2e8f0;
}

.player-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.align-center {
    align-items: center;
}

.call-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.05em;
}

.call-input {
    width: 60px;
    height: 42px;
    padding: 4px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    background-color: #f8fafc;
    color: #0f172a;
    transition: border-color 0.1s ease, background-color 0.1s ease;
    outline: none;
}

.call-input:focus {
    border-color: #4f46e5;
    background-color: #ffffff;
}

.static-value {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    min-width: 40px;
    text-align: center;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Prediction validation notice helper */
.setup-copy {
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    margin: 4px 0 0 0;
    padding: 10px 14px;
    border-radius: 8px;
    background-color: #eff6ff;
    color: #2563eb;
    border: 1px solid #dbeafe;
}

.setup-copy.warning-copy {
    background-color: #fffbeb;
    color: #d97706;
    border-color: #fef3c7;
}

/* ==========================================
   SCOREBOARD TABLE STYLING
   ========================================== */
.table-shell {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    background: #ffffff;
    -webkit-overflow-scrolling: touch;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

table {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
}

th,
td {
    padding: 10px 12px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
}

thead th {
    background-color: #f8fafc;
    color: #0f172a;
    font-weight: 700;
}

.round-header,
.round-cell {
    min-width: 90px;
    text-align: left;
    position: sticky;
    left: 0;
    background-color: #ffffff;
    z-index: 10;
    border-right: 1px solid #e2e8f0;
}

thead th.round-header {
    background-color: #f8fafc;
    z-index: 11;
}

.round-meta {
    display: flex;
    flex-direction: column;
}

.player-header {
    min-width: 100px;
    background-color: #f1f5f9;
    border-left: 1px solid #e2e8f0;
}

.player-name-th {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    color: #334155;
}

.sub-header th {
    padding-top: 6px;
    padding-bottom: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
}

.score-header,
.score-cell {
    color: #64748b;
    background-color: #fbfbfb;
}

.score-cell {
    font-weight: 500;
}

.tricks-cell {
    color: #0f172a;
    font-weight: 600;
    border-right: 1px solid #f1f5f9;
}

.sticky-bottom-row-label th,
.sticky-bottom-row-label td {
    border-top: 1.5px solid #cbd5e1;
    background-color: #f8fafc;
}

.total-row {
    background-color: #f8fafc;
}

.total-row td {
    border-bottom: none;
}

.total-label-cell {
    background-color: #f8fafc;
}

.total-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #0f172a;
}

.total-score {
    font-weight: 700;
    color: #4f46e5;
    background-color: #f5f3ff;
}

.total-place {
    font-weight: 700;
    color: #10b981;
}

.small-scale {
    transform: scale(0.85);
    transform-origin: left center;
}

/* ==========================================
   NEW: STANDINGS / PODIUM STYLING
   ========================================== */
.standings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
}

.section-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.standings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.standing-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01);
}

.winner-card {
    border-left: 4px solid #f59e0b;
}

.standing-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.standing-rank {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    border: 1px solid #e2e8f0;
    background-color: #f8fafc;
    color: #64748b;
}

/* podium top spots highlight */
.standing-rank.rank-0 {
    background-color: #fef3c7;
    color: #d97706;
    border-color: #fcd34d;
}

.standing-rank.rank-1 {
    background-color: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
}

.standing-rank.rank-2 {
    background-color: #ffedd5;
    color: #c2410c;
    border-color: #fed7aa;
}

.standing-player-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #0f172a;
}

.standing-score-badge {
    background-color: #f1f5f9;
    color: #334155;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
}

.winner-card .standing-score-badge {
    background-color: #fef3c7;
    color: #b45309;
}

/* ==========================================
   FOOTER & PRIMARY ACTIONS
   ========================================== */
.app-footer {
    border-top: 1px solid #e2e8f0;
    background-color: #ffffff;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px;
}

.btn {
    display: block;
    width: 100%;
    min-height: 48px;
    padding: 12px 16px;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    text-align: center;
    user-select: none;
    transition: transform 0.1s ease, opacity 0.1s ease;
}

.btn:active {
    transform: scale(0.98);
}

.btn-primary {
    background-color: #4f46e5;
    color: #ffffff;
}

.btn-primary:disabled {
    background-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
    transform: none;
}
</style>