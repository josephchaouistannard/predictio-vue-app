<script setup lang="ts">
import { onMounted } from 'vue';
import { App } from '@capacitor/app';
import { usePlayerStore } from './stores/playerStore';
import { useGameStore } from './stores/gameStore';

import 'material-symbols'

const ps = usePlayerStore()
const gs = useGameStore()

onMounted(async () => {
  await ps.initialise()
  await gs.initialise()
  App.addListener('appStateChange', ({ isActive }) => {

  });
})
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
