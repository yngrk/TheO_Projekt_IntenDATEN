<script setup lang="ts">
import axios from "axios";
import type {TheatreItem} from "~/types";

const pins = ref<string[]>([])
const arcs = ref<{from: string, to: string}[]>([])

onMounted(async () => {
  const res = await axios.get('/api/excel/theatres', {
    params: {
      type: ''
    }
  })
  const {success, data} = res.data
  pins.value = data.map((i: TheatreItem) => i.city)
})

</script>

<template>
  <div>
      <GermanyMap :pins="pins" :arcs="arcs"></GermanyMap>
  </div>
</template>