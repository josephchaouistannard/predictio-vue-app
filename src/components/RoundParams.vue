<script setup lang="ts">
import type { RoundSetup } from '@/types/appTypes';
import { computed } from 'vue'

const props = defineProps<{ r: RoundSetup }>()

const trumpImagePath = computed(() => {
    return new URL(`../assets/trumps/${props.r.trump}.svg`, import.meta.url).href
})
</script>

<template>
    <div>
        <p>{{ r.cardsDealt }}</p>
        <img :src="trumpImagePath" :alt="r.trump">
    </div>
</template>

<style lang="css" scoped>
div {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 30px;
    height: 30px;
    padding: 0.2rem;
}

p {
    font-size: 2em;
}

img {
    max-width: 100%;
    max-height: 100%;
}
</style>