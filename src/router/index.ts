import HomeView from '@/views/HomeView.vue'
import GameView from '@/views/GameView.vue'
import SetupView from '@/views/SetupView.vue'
import PlayersView from '@/views/PlayersView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/game/:gameId', name: 'game', component: GameView, props: true },
    { path: '/setup', name: 'setup', component: SetupView },
    { path: '/players', name: 'players', component: PlayersView },
  ],
})

export default router
