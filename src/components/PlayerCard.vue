<script setup lang="ts">
import type { Player } from '@/types/appTypes';

const props = defineProps<{
    player: Player,
}>()

const emits = defineEmits<{
    toggleActive: [player: Player],
    deletePlayer: [player: Player]
}>()
</script>

<template>
    <div :class="{ inactive: !player.isActive }" class="player-card-row">
        <span class="player-name">{{ player.name }}</span>
        <div class="actions">
            <button 
                class="action-button toggle-btn" 
                @click="emits('toggleActive', player)"
                :aria-label="player.isActive ? 'Hide Player' : 'Show Player'"
            >
                <span class="material-symbols-outlined">
                    {{ player.isActive ? 'visibility_off' : 'visibility' }}
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.player-card-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 8px 8px 16px; /* Extra padding on the left for text alignment */
    transition: background-color 0.15s ease, opacity 0.15s ease;
}

.player-name {
    font-size: 1rem;
    font-weight: 500;
    color: #0f172a;
    transition: color 0.15s ease;
}

.actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.action-button {
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.action-button:active {
    background-color: #f1f5f9;
}

.toggle-btn {
    color: #4f46e5;
}

/* Inactive styles */
.inactive {
    background-color: #f8fafc;
    border-color: #f1f5f9;
}

.inactive .player-name {
    text-decoration: line-through;
    color: #94a3b8;
}

.inactive .toggle-btn {
    color: #94a3b8;
}
</style>