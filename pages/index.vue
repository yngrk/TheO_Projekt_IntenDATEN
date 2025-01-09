<script setup lang="ts">
const mapDefaults = {
  pins: ['Düsseldorf', 'München'],
  arcs: [
    {from: "Düsseldorf", to: "München"}
  ]
}
</script>

<template>
  <div class="flex justify-center">
    <GermanyMap :pins="mapDefaults.pins" :arcs="mapDefaults.arcs"></GermanyMap>
  </div>
</template>