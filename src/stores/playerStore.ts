import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getPlayers, getPlayerById, addOrUpdatePlayer } from '@/db/playerService'
import type { Player } from '@/types/appTypes'

export const usePlayerStore = defineStore('playerStore', () => {
    const isInitialised = ref(false)
    async function initialise() {
        if (isInitialised.value) return

        await loadPlayers()
        isInitialised.value = true
    }

    async function loadPlayers() {
        players.value = await getPlayers()
    }

    const players = ref<Player[]>([])

    async function addPlayer(name: string) {
        const player: Player = {
            id: crypto.randomUUID(),
            name: name,
            photoPath: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
        }
        await addOrUpdatePlayer(player)
        await loadPlayers()
    }

    async function togglePlayerActive(player: Player) {
        player.isActive = !player.isActive
        await addOrUpdatePlayer(player)
        await loadPlayers()
    }



    return {
        initialise,
        players,
        addPlayer,
        togglePlayerActive,
    }
})
