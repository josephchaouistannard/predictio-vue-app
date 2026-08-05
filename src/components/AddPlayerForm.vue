<script setup lang="ts">
import { ref } from 'vue'

const newPlayerName = ref('')

const emits = defineEmits<{
    playerAdded: [name: string]
}>()

function handleSubmit() {
    const name = newPlayerName.value.trim()

    if (!name) return

    emits('playerAdded', name)
    newPlayerName.value = ''
}
</script>

<template>
    <form class="form-wrapper" @submit.prevent="handleSubmit">
        <label class="input-label" for="player-input">Add a new player</label>
        <div class="input-row">
            <input 
                id="player-input"
                type="text" 
                placeholder="Name" 
                v-model="newPlayerName" 
                @keydown.enter="handleSubmit"
                class="text-input"
            />
            <button type="submit" class="add-button" aria-label="Add Player">
                <span class="material-symbols-outlined">add</span>
            </button>
        </div>
    </form>
</template>

<style scoped>
.form-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 8px;
}

.input-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
}

.input-row {
    display: flex;
    flex-direction: row;
    gap: 8px;
    width: 100%;
}

.text-input {
    flex: 1;
    min-height: 48px;
    padding: 10px 14px;
    font-size: 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background-color: #f8fafc;
    color: #0f172a;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

.text-input:focus {
    outline: none;
    border-color: #4f46e5;
    background-color: #ffffff;
}

.add-button {
    width: 48px;
    height: 48px;
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.add-button:active {
    background-color: #4338ca;
}

.add-button span {
    font-size: 24px;
}
</style>