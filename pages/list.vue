<script setup lang="ts">
import type {PlaceGeometry} from "~/server/types";
import axios from "axios";

const toast = useToast()

interface TableItem {
  id: string
  name: string
  state: string
  geo: [number, number]
  coordinates: [number, number]
}

/**
 * TABLE RELATED CODE
 */

const places = ref<TableItem[]>([])
const selected = ref<TableItem[]>([])
const q = ref('')

const loading = computed(() => places.value.length < 1)

const columns = [
  {
    key: 'id',
    label: 'ID',
  },
  {
    key: 'name',
    label: 'Stadt',
    sortable: true
  },
  {
    key: 'state',
    label: 'Bundesland',
    sortable: true
  },
  {
    key: 'coordinates',
    label: 'Koordinaten'
  },
  {
    key: 'geo',
    label: 'Geodaten'
  },
]

const filteredRows = computed(() => {
  if (!q.value) {
    return places.value
  }

  return places.value.filter((person) => {
    return Object.values(person).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase())
    })
  })
})


/**
 * SECTION FOR ADD-FORM
 */

const isOpenAddModal = ref(false)

const addFormData = reactive({
  name: '',
  state: '',
  lon: 0,
  lat: 0,
})

const clearAddFormData = () => {
  addFormData.name = ''
  addFormData.state = ''
  addFormData.lon = 0
  addFormData.lat = 0
}

const handleAddSubmit = async () => {
  if (
      !addFormData.name
      || !addFormData.state
  ) {
    toast.add({
      title: 'Nicht alle Felder wurden ausgefüllt.',
      color: 'red'
    })
    return
  }

  // calculate topo coordinates based on lon,lat
  const coords = lonLatToTopo([addFormData.lon, addFormData.lat])

  // create PlaceGeometry Item for topoJSON
  const newPlace: PlaceGeometry = {
    type: 'Point',
    coordinates: coords,
    properties: {
      name: addFormData.name,
      nameEN: null,
      state: addFormData.state
    },
    id: addFormData.name
  }

  // use endpoint to post item to topoJSON
  try {
    const response = await axios.post('/api/topo/add-place', newPlace)
    const result = response.data

    if (result.success) {
      // success
      toast.add({
        title: `${addFormData.name} wurde erfolgreich gespeichert.`
      })
      clearAddFormData()

      isOpenAddModal.value = false
      await fetchPlaces()
    } else {
      toast.add({
        title: `${addFormData.name} konnte nicht gespeichert werden \n Error: ${result.error}`,
        color: 'red'
      })
    }
  } catch (error: any) {
    toast.add({
      title: error.message,
      color: 'red'
    })
    console.error('Error while adding place:', error)
  }
}

watch(isOpenAddModal, (newVal) => {
  if (!newVal) {
    clearAddFormData()
  }
})

/**
 * DELETE BUTTON RELATED
 */
const showDelBtn = computed(() => selected.value.length > 0)

const isOpenDelModal = ref(false)

const handleDeleteSubmit = async () => {
  // create id-list for deletion
  const ids = selected.value.map((i) => i.id)

  // make post request to delete ids from topoJSON
  try {
    const response = await axios.post('/api/topo/remove-places', {
      ids
    })
    const result = response.data

    if (result.success) {
      // success
      toast.add({
        title: `${ids.length} Einträge wurden erfolgreich gelöscht.`
      })

      isOpenDelModal.value = false
      selected.value = []
      await fetchPlaces()
    } else {
      toast.add({
        title: result.error,
        color: 'red'
      })
    }
  } catch (error: any) {
    toast.add({
      title: error.message,
      color: 'red'
    })
    console.error('Error while deleting places:', error)
  }


  // success
  isOpenDelModal.value = false
  selected.value = []
}

/**
 * HOOKS
 */
onMounted(async () => {
  await fetchPlaces()
})

const fetchPlaces = async () => {
  const res = await axios.get('/api/topo/get-places')
  const {success, data} = res.data

  places.value = data.map((p: PlaceGeometry) => ({
    id: p.id,
    name: p.properties.name,
    state: p.properties.state,
    geo: topoToLonLat(p.coordinates),
    coordinates: p.coordinates
  }))
}

</script>

<template>
  <div class="flex flex-col max-h-[100dvh]">
    <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700 w-full">
      <UInput v-model="q" placeholder="Suche..." class="w-full" />
    </div>
    <UTable :rows="filteredRows"
            :columns="columns"
            v-model="selected"
            :loading="loading"
            :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
            :progress="{ color: 'primary', animation: 'carousel' }"
            class="pb-24"
    />

    <div>
      <div class="absolute bottom-10 right-10 flex gap-2">
        <transition name="fade">
          <UButton
              v-if="showDelBtn"
              color="red"
              size="xl"
              class="w-fit"
              :ui="{rounded: 'rounded-full'}"
              icon="ri:delete-bin-2-fill"
              @click="isOpenDelModal = true"
          />
        </transition>

        <UButton @click="isOpenAddModal = true"
                 :ui="{rounded: 'rounded-full'}"
                 size="xl"
                 icon="ri:add-line"
                 class="w-fit"
        />
      </div>

      <UModal v-model="isOpenAddModal">
        <UCard>
          <template #header>
            <div class="text-sm">Stadt hinzufügen</div>
          </template>

          <div class="flex flex-col gap-4">
            <UFormGroup label="Stadt">
              <UInput size="lg" v-model="addFormData.name"></UInput>
            </UFormGroup>

            <UFormGroup label="Bundesland">
              <UInput size="lg" v-model="addFormData.state"></UInput>
            </UFormGroup>

            <UFormGroup label="Längengrad">
              <UInput type="number" size="lg" v-model="addFormData.lon"></UInput>
            </UFormGroup>

            <UFormGroup label="Breitengrad">
              <UInput type="number" size="lg" v-model="addFormData.lat"></UInput>
            </UFormGroup>
          </div>

          <template #footer>
            <div class="flex justify-end">
              <UButton size="lg" @click="handleAddSubmit">Speichern</UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <UModal v-model="isOpenDelModal">
        <UCard>
          <template #header>
            <div class="text-sm">Folgende Einträge werden gelöscht:</div>
          </template>

          <UTable :rows="selected" />

          <template #footer>
            <div class="flex justify-end">
              <UButton size="lg" color="red" @click="handleDeleteSubmit">Löschen</UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>