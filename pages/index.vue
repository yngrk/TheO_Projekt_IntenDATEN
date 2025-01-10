<script setup lang="ts">
import axios from "axios";

const mapDefaults = {
  pins: ['Düsseldorf', 'München'],
  arcs: [
    {from: "Düsseldorf", to: "München"}
  ]
}

onMounted(async () => {
  const res = await axios.get('/api/all-data')
  console.log(res.data)
})

</script>

<template>
  <div class="flex justify-center">
    <GermanyMap :pins="mapDefaults.pins" :arcs="mapDefaults.arcs"></GermanyMap>
  </div>
</template>