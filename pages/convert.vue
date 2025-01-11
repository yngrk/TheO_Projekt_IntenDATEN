<script setup lang="ts">
const inLon = ref<number>(0)
const inLat = ref<number>(0)
const outX = ref<number | null>(null)
const outY = ref<number | null>(null)

const inX = ref<number>(0)
const inY = ref<number>(0)
const outLon = ref<number | null>(null)
const outLat = ref<number | null>(null)

const calcTopo = () => {
  const res = lonLatToTopo([inLon.value, inLat.value])
  outX.value = res[0]
  outY.value = res[1]
}

const calcLonLat = () => {
  const res = topoToLonLat([inX.value, inY.value])
  outLon.value = res[0]
  outLat.value = res[1]
}

</script>

<template>
  <div class="p-6 flex flex-col gap-4">
    <div class="flex gap-4">
      <div class="flex-1">
        <label for="lon">LON</label>
        <input v-model="inLon" type="number" id="lon" class="w-full text-black bg-white">
      </div>

      <div class="flex-1">
        <label for="lat">LAT</label>
        <input v-model="inLat" type="number" id="lat" class="w-full text-black bg-white">
      </div>
    </div>

    <button @click="calcTopo" class="bg-gray-400 text-black px-2 py-1 rounded-md">calculate</button>

    <div>
      <div>Results:</div>
      <div class="border">
        <div class="px-4 py-2 flex gap-4">
          <div>x:</div>
          <div>{{ outX }}</div>
        </div>
        <div class="px-4 py-2 flex gap-4">
          <div>y:</div>
          <div>{{ outY }}</div>
        </div>
      </div>
    </div>

    <div class="flex gap-4">
      <div class="flex-1">
        <label for="x">X</label>
        <input v-model="inX" type="number" id="x" class="w-full text-black bg-white">
      </div>

      <div class="flex-1">
        <label for="y">Y</label>
        <input v-model="inY" type="number" id="y" class="w-full text-black bg-white">
      </div>
    </div>

    <button @click="calcLonLat" class="bg-gray-400 text-black px-2 py-1 rounded-md">calculate</button>

    <div>
      <div>Results:</div>
      <div class="border">
        <div class="px-4 py-2 flex gap-4">
          <div>lon:</div>
          <div>{{ outLon }}</div>
        </div>
        <div class="px-4 py-2 flex gap-4">
          <div>lat:</div>
          <div>{{ outLat }}</div>
        </div>
      </div>
    </div>
  </div>
</template>