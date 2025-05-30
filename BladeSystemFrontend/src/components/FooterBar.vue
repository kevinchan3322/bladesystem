<script setup>
import { containerMaxW } from '@/config.js'
import BaseLevel from '@/components/BaseLevel.vue'
import JustboilLogo from '@/components/JustboilLogo.vue'

// const year = new Date().getFullYear()
const year = '2024'
</script>

<template>
  <footer class="flex justify-end w-full py-2 px-6" :class="containerMaxW">
    <div class="items-end text-center md:text-left">
      <b>&copy;{{ year }}, DataXquad. All rights reserved.</b>
      <slot />
    </div>
    <!-- <BaseLevel>
      <div class="text-center md:text-left">
        <b>&copy;{{ year }}, <a href="https://justboil.me/" target="_blank">JustBoil.me</a>.</b>
        <slot />
      </div>
      <div class="md:py-2">
        <a href="https://justboil.me">
          <JustboilLogo class="w-auto h-8 md:h-6" />
        </a>
      </div>
    </BaseLevel> -->
  </footer>
</template>
