<script setup lang="ts">
import AddPlayerForm from '@/components/AddPlayerForm.vue';
import PlayerCard from '@/components/PlayerCard.vue';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { Player } from '@/types/appTypes';
import { App } from '@capacitor/app';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const ps = usePlayerStore()
const gs = useGameStore()

async function addPlayer(name: string) {
    await ps.addPlayer(name)
}
async function togglePlayerActive(player: Player) {
    await ps.togglePlayerActive(player)
}
const showInactive = ref(false)
const visiblePlayers = computed(() => {
    if (!showInactive.value) {
        return ps.players.filter((p) => p.isActive)
    }
    return ps.players
})

function back() {
    router.push({ name: 'home' })
}
onMounted(() => {
    App.addListener('backButton', () => {
        back()
    })
})
</script>

<template>
    <div class="app-container">
        <header class="app-header">
            <div class="header-left">
                <button class="icon-button" @click="back" aria-label="Go Back">
                    <span class="material-symbols-outlined">arrow_back</span>
                </button>
            </div>
            <h1 class="app-title">Manage Players</h1>
            <div class="header-right"></div>
        </header>

        <main class="content-scroll">
            <div class="form-container">
                <add-player-form @player-added="addPlayer" />
            </div>

            <div class="filter-toggle-row">
                <label for="show-inactive-checkbox" class="toggle-label">Show inactive players?</label>
                <div class="checkbox-wrapper">
                    <input 
                        type="checkbox" 
                        id="show-inactive-checkbox" 
                        v-model="showInactive" 
                        class="modern-checkbox"
                    />
                </div>
            </div>

            <section class="players-section">
                <h2 class="section-title">Players ({{ visiblePlayers.length }})</h2>
                <div class="players-list">
                    <template v-for="player in visiblePlayers" :key="player.id">
                        <player-card :player="player" @toggle-active="togglePlayerActive(player)" />
                    </template>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
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

.app-title {
    font-size: 1.15rem;
    font-weight: 700;
    text-align: center;
    margin: 0;
    color: #0f172a;
}

.header-right {
    /* Balance placeholder */
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
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}

.form-container {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
}

/* Toggle row style */
.filter-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
}

.toggle-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #334155;
    user-select: none;
}

.checkbox-wrapper {
    display: flex;
    align-items: center;
}

.modern-checkbox {
    width: 22px;
    height: 22px;
    accent-color: #4f46e5; /* Match primary brand color */
    cursor: pointer;
}

/* List section styles */
.players-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.section-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.players-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>