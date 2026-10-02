<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { GamePhase, type Player } from '@/types/appTypes';
import { checkForUpdate } from '@/utils/versionCheck';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AppLauncher } from '@capacitor/app-launcher';

const router = useRouter()
const ps = usePlayerStore()
const gs = useGameStore()

async function deleteGameInProgress() {
    await gs.deleteGameInProgress()
}

async function deletePastGame(id: string) {
    await gs.deletePastGame(id)
}

const updateAvailable = ref(false)
onMounted(async () => {

    const currentVersion = __APP_VERSION__
    console.log('Current version', currentVersion)

    const update = await checkForUpdate(currentVersion)

    if (update.available) {
        console.log(`New version: ${update.version}`)
        updateAvailable.value = true
    }
})

async function goToGithubReleases() {
    await AppLauncher.openUrl({
        url: 'https://github.com/josephchaouistannard/predictio-vue-app/releases/latest',
    });
}
</script>

<template>
    <div class="app-container">
        <header class="app-header">
            <div class="header-left"></div>
            <h1 class="app-title">Predictio</h1>
            <div class="header-right">
                <button class="icon-button" @click="router.push('/players')" aria-label="Edit Players">
                    <span class="material-symbols-outlined">person_edit</span>
                </button>
                <button v-if="updateAvailable" class="icon-button" @click="goToGithubReleases"
                    aria-label="Edit Players">
                    <span class="material-symbols-outlined">upgrade</span>
                </button>
            </div>
        </header>

        <main class="content-scroll">
            <section class="action-section">
                <template v-if="gs.gameInProgress">
                    <button class="btn btn-primary" @click="router.push(`/game/${gs.gameInProgress.id}`)">
                        Resume game in progress
                    </button>
                    <button class="btn btn-danger-outline" @click="deleteGameInProgress">
                        Delete game in progress
                    </button>
                </template>
                <button v-else class="btn btn-primary" @click="router.push({ name: 'setup' })">
                    Start new game
                </button>
            </section>

            <section class="history-section">
                <h2 class="section-title">Past Games</h2>
                <div class="games-list">
                    <template v-for="game in gs.games" :key="game.id">
                        <div v-if="game.phase === GamePhase.Finished" @click="router.push(`/game/${game.id}`)"
                            class="game-card">
                            <div class="game-card-header">
                                <span class="game-date">
                                    {{ new Date(game.finishedAt!).toLocaleDateString(undefined, {
                                        month: 'short', day:
                                            'numeric', hour: '2-digit', minute: '2-digit'
                                    }) }}
                                </span>
                                <span class="game-players">{{ game.players.length }} Players</span>
                            </div>
                            <div class="game-card-body">
                                <span class="winner-label">Winner</span>
                                <span class="winner-name">
                                    {{ps.players.find((p) => game.players.find((gp) => gp.finalRank === 0)?.playerId
                                        === p.id)?.name || 'N/A'}}
                                </span>
                                <span class="material-symbols-outlined icon-button delete-game-button"
                                @click.stop="deletePastGame(game.id)">
                                    delete
                                </span>
                            </div>
                        </div>
                    </template>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
/* ==========================================
   GLOBAL RESETS & VARIABLES (for mobile)
   ========================================== */
:global(html),
:global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* Prevents bounce scroll on the body container */
    background-color: #f8fafc;
    /* Cool slate background */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    -webkit-tap-highlight-color: transparent;
    /* Removes blue tap flicker on iOS */
    -webkit-font-smoothing: antialiased;
}

:global(*) {
    box-sizing: border-box;
}

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
    /* Safe-area-inset-top protects content under status bar on iOS/Android */
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px 16px;
}

.app-title {
    font-size: 1.15rem;
    font-weight: 700;
    text-align: center;
    margin: 0;
    color: #0f172a;
    letter-spacing: -0.01em;
}

.header-right {
    display: flex;
    justify-content: flex-end;
}

.icon-button {
    background: none;
    border: none;
    color: #4f46e5;
    /* Primary indigo action color */
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease;
}

.delete-game-button {
    padding: 0;
}

.icon-button:active {
    background-color: #f1f5f9;
}

.icon-button span {
    font-size: 24px;
}

/* ==========================================
   CONTENT SCROLL CONTAINER
   ========================================== */
.content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    /* safe-area-inset-bottom preserves spacing over iOS Home Indicator bar */
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}

/* ==========================================
   BUTTONS
   ========================================== */
.action-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
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

/* iOS active feedback scale */
.btn:active {
    transform: scale(0.98);
    opacity: 0.9;
}

.btn-primary {
    background-color: #4f46e5;
    color: #ffffff;
}

.btn-danger-outline {
    background-color: transparent;
    color: #ef4444;
    border: 1.5px solid #fee2e2;
}

.btn-danger-outline:active {
    background-color: #fef2f2;
}

/* ==========================================
   HISTORY SECTION & CARDS
   ========================================== */
.history-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #64748b;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.games-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.game-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.game-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.game-date {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
}

.game-players {
    font-size: 0.75rem;
    background-color: #f1f5f9;
    color: #475569;
    padding: 4px 8px;
    border-radius: 20px;
    font-weight: 600;
}

.game-card-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
}

.winner-label {
    font-size: 0.85rem;
    color: #64748b;
}

.winner-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #10b981;
    /* Green color accentuating the winner */
}
</style>