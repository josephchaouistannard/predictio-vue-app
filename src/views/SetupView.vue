<script setup lang="ts">
import AddPlayerForm from '@/components/AddPlayerForm.vue';
import PlayerCard from '@/components/PlayerCard.vue';
import RoundParams from '@/components/RoundParams.vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { GamePlayer, Player, RoundSetup } from '@/types/appTypes';
import { trumpOrder } from '@/types/constants';
import { App } from '@capacitor/app';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import draggable from 'vuedraggable'


// -------------- COMMON --------------
const router = useRouter()
const ps = usePlayerStore()
const gs = useGameStore()

enum SetupPhase {
    Players = 'players',
    Rounds = 'rounds',
}
const setupPhase = ref<SetupPhase>(SetupPhase.Players)

function back() {
    if (setupPhase.value === SetupPhase.Rounds) {
        setupPhase.value = SetupPhase.Players
    } else {
        router.push({ name: 'home' })
    }
}

onMounted(async () => {
    await ps.initialise()
    await gs.initialise()
    App.addListener('backButton', () => {
        back()
    })
})


// -------------- PLAYERS --------------
const activePlayers = computed(() => {
    return ps.players.filter((p) => p.isActive)
})
const selectedPlayers = ref<Player[]>([])
const unselectedPlayers = ref<Player[]>([...activePlayers.value])

/** Text explanation of dealer and player order */
const dealerExplanation = computed(() => {
    if (selectedPlayers.value.length === 0) { return 'Please select some players' }
    const players = selectedPlayers.value
    if (players.length > 1) {
        return `${players[0]!.name} will deal first, then ${players[1]!.name}...`
    }
    return `${players[0]!.name} will deal first`
})

/** true if player settings are valid, false otherwise */
const validPlayers = computed(() => {
    if (selectedPlayers.value.length < 2) { return false }
    return true
})

// -------------- ROUNDS --------------
const cardsInDeck = 52
const maxNbCards = computed(() => {
    if (selectedPlayers.value.length === 0) { return 1 }
    return Math.floor(cardsInDeck / selectedPlayers.value.length)
})
const minNbCards = 1
/** Highest chosen number of cards dealt */
const highestRound = ref(1)
/** Lowest chosen number of cards dealt */
const lowestRound = ref(1)

function changeCardsDealt(pm: '+' | '-', hl: 'h' | 'l') {
    switch (pm + hl) {
        case ('+h'):
            if (highestRound.value < maxNbCards.value) { highestRound.value++ }
            break
        case ('-h'):
            if (highestRound.value > minNbCards && highestRound.value > lowestRound.value) {
                highestRound.value--
            }
            break
        case ('+l'):
            if (lowestRound.value < maxNbCards.value && highestRound.value > lowestRound.value) {
                lowestRound.value++
            }
            break
        case ('-l'):
            if (lowestRound.value > minNbCards) { lowestRound.value-- }
            break
    }
}

/** Watch for changes to the max number of cards in a round, and update the highest/lowest round values accordingly. */
watch(maxNbCards, (newMax) => {
    highestRound.value = Math.min(highestRound.value, newMax)
    lowestRound.value = Math.min(lowestRound.value, newMax)

    // Ensure lowest never exceeds highest
    if (lowestRound.value > highestRound.value) {
        lowestRound.value = highestRound.value
    }
})

/** The number of rounds to be player with current settings */
const nbRounds = computed(() => 2 * (highestRound.value - lowestRound.value) + 1)

/** Array of RoundSetup objects resulting from the current settings */
const rounds = computed<RoundSetup[]>(() => {
    const trumps = trumpOrder

    const rounds: RoundSetup[] = []

    let ascendingRound = lowestRound.value + 1
    const descendingCount =
        highestRound.value - lowestRound.value + 1

    for (let i = 0; i < nbRounds.value; i++) {
        rounds.push({
            cardsDealt: i < descendingCount
                ? highestRound.value - i
                : ascendingRound++,
            trump: trumps[i % trumps.length]!
        })
    }

    return rounds
})

/** true if round settings are valid, false otherwise */
const validRounds = computed(() => {
    if (highestRound.value < lowestRound.value || highestRound.value > maxNbCards.value || lowestRound.value < minNbCards) {
        return false
    }
    return true
})

// -------------- GAME START --------------
async function startGame() {
    if (!validRounds.value || !validPlayers.value) { return }
    const newGameId = crypto.randomUUID()
    console.log('Starting game, id', newGameId)
    await gs.startNewGame([...rounds.value], [...selectedPlayers.value], newGameId)
    router.push(`/game/${newGameId}`)
}

</script>

<template>
    <div class="app-container">
        <header class="app-header">
            <div class="header-left">
                <button class="icon-button" @click="back" aria-label="Go Back">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
            </div>
            <h1 class="app-title">
                {{ setupPhase === SetupPhase.Players ? "Who's playing?" : "How many rounds?" }}
            </h1>
            <div class="header-right">
                <button class="icon-button" @click="router.push('/players')" aria-label="Edit Players">
                    <span class="material-symbols-outlined">person_edit</span>
                </button>
            </div>
        </header>

        <main class="content-scroll">
            <!-- PHASE 1: PLAYERS SETUP -->
            <section v-if="setupPhase === SetupPhase.Players" class="setup-section">
                <div class="lists-wrapper">
                    <!-- Selected List -->
                    <div class="list-card selected-zone">
                        <h3 class="list-title">Selected</h3>
                        <draggable 
                            :list="selectedPlayers" 
                            group="players" 
                            item-key="id" 
                            :animation="200"
                            class="drag-area"
                        >
                            <template #item="{ element }">
                                <div class="player-chip chip-selected">
                                    <span class="drag-indicator">☰</span>
                                    <span class="chip-name">{{ element.name }}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>

                    <!-- Unselected List -->
                    <div class="list-card unselected-zone">
                        <h3 class="list-title">Available</h3>
                        <draggable 
                            :list="unselectedPlayers" 
                            group="players" 
                            item-key="id" 
                            :animation="200"
                            class="drag-area"
                        >
                            <template #item="{ element }">
                                <div class="player-chip">
                                    <span class="drag-indicator">☰</span>
                                    <span class="chip-name">{{ element.name }}</span>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>

                <div class="dealer-info-box">
                    <span class="material-symbols-outlined info-icon">info</span>
                    <p class="info-text">{{ dealerExplanation }}</p>
                </div>
            </section>

            <!-- PHASE 2: ROUND SETUP -->
            <section v-else class="setup-section gap-lg">
                <div class="selector-card">
                    <div class="round-adjustment-row">
                        <div class="row-label-group">
                            <span class="row-title">Highest Round</span>
                            <span class="row-subtitle">Max cards to deal</span>
                        </div>
                        <div class="counter-control">
                            <button class="counter-btn" @click="changeCardsDealt('-', 'h')">-</button>
                            <span class="counter-value">{{ Math.min(highestRound, maxNbCards) }}</span>
                            <button class="counter-btn" @click="changeCardsDealt('+', 'h')">+</button>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="round-adjustment-row">
                        <div class="row-label-group">
                            <span class="row-title">Lowest Round</span>
                            <span class="row-subtitle">Min cards to deal</span>
                        </div>
                        <div class="counter-control">
                            <button class="counter-btn" @click="changeCardsDealt('-', 'l')">-</button>
                            <span class="counter-value">{{ lowestRound }}</span>
                            <button class="counter-btn" @click="changeCardsDealt('+', 'l')">+</button>
                        </div>
                    </div>
                </div>

                <div class="recap-header">
                    <h3 class="section-title">Round Sequence</h3>
                    <span class="badge">{{ nbRounds }} total rounds</span>
                </div>

                <div class="roundRecap">
                    <round-params v-for="r of rounds" :r="r" />
                </div>
            </section>
        </main>

        <footer class="app-footer">
            <button 
                v-if="setupPhase === SetupPhase.Players" 
                class="btn btn-primary btn-block" 
                :disabled="!validPlayers"
                @click="setupPhase = SetupPhase.Rounds"
            >
                Next
            </button>
            <button 
                v-else 
                class="btn btn-primary btn-block" 
                :disabled="!validRounds || !validPlayers"
                @click="startGame"
            >
                Start Game
            </button>
        </footer>
    </div>
</template>

<style scoped>
/* ==========================================
   LAYOUT STRUCTURE
   ========================================== */
.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
}

.app-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px 16px;
}

.header-left {
    display: flex;
    justify-content: flex-start;
}

.header-right {
    display: flex;
    justify-content: flex-end;
}

.app-title {
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

.icon-button span {
    font-size: 24px;
}

.content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background-color: #f8fafc;
}

.setup-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
}

.gap-lg {
    gap: 24px;
}

/* ==========================================
   DRAG AND DROP LAYOUT
   ========================================== */
.lists-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.list-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.selected-zone {
    border-color: #c7d2fe;
    background-color: #fefeff;
}

.list-title {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #475569;
    margin: 0;
    text-align: center;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
}

/* drag-area matches the draggable component */
.drag-area {
    min-height: 250px; /* Crucial so dragging into empty columns works */
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.player-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    cursor: grab;
    user-select: none;
}

.player-chip:active {
    cursor: grabbing;
}

.chip-selected {
    background-color: #e0e7ff;
    border-color: #c7d2fe;
    color: #4338ca;
}

.drag-indicator {
    font-size: 0.85rem;
    color: #94a3b8;
}

.chip-selected .drag-indicator {
    color: #818cf8;
}

.chip-name {
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Info Banner */
.dealer-info-box {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 12px 14px;
    border-radius: 10px;
}

.info-icon {
    color: #3b82f6;
    font-size: 20px;
    margin-top: 2px;
}

.info-text {
    margin: 0;
    font-size: 0.85rem;
    color: #1e3a8a;
    line-height: 1.4;
    font-weight: 500;
}

/* ==========================================
   ROUND CONFIGURATION SELECTORS
   ========================================== */
.selector-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.round-adjustment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.row-label-group {
    display: flex;
    flex-direction: column;
}

.row-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0f172a;
}

.row-subtitle {
    font-size: 0.8rem;
    color: #64748b;
}

.counter-control {
    display: flex;
    align-items: center;
    gap: 14px;
}

.counter-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #0f172a;
    font-size: 1.25rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.1s ease;
}

.counter-btn:active {
    background-color: #f1f5f9;
}

.counter-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    min-width: 24px;
    text-align: center;
}

.divider {
    height: 1px;
    background-color: #f1f5f9;
}

.recap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.badge {
    background-color: #e2e8f0;
    color: #334155;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
}

.roundRecap {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
    gap: 8px;
    max-height: 40vh;
    overflow-y: auto;
    width: 100%;
    padding: 2px;
}

/* ==========================================
   FOOTER BUTTONS
   ========================================== */
.app-footer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px;
    background-color: #ffffff;
    border-top: 1px solid #e2e8f0;
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