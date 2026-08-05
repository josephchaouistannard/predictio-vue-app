import type { Player } from "@/types/appTypes"
import { db } from "./db"

/**
 * Get all players from the db
 * @returns Array of PlayerRow objects
 */
export async function getPlayers() {
    const result = await db.players.toArray()
    return result
}

/**
 * Add or update a player in the db
 * @param player Player object (no conversion to PlayerRow needed currently)
 */
export async function addOrUpdatePlayer(player: Player) {
    await db.players.put(player)
}

/**
 * Get a player by ID
 * @param id Player ID
 * @returns A PlayerRow object or undefined
 */
export async function getPlayerById(id: string) {
    const result = await db.players.get(id)
    return result
}