<template>
  <div ref="mapContainer" class="map-container">
    <svg ref="svgRef"></svg>
    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { Topology } from "topojson-specification"
import { feature } from 'topojson-client'

// Define refs for DOM elements
const mapContainer = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

// Reactive dimensions
const dimensions = reactive({
  width: 0,
  height: 0
})

// Function to update dimensions
const updateDimensions = () => {
  dimensions.width = window.innerWidth
  dimensions.height = window.innerHeight
}

// Define the city interface
interface City {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

// Reactive array to store cities
const cities = ref<City[]>([])

// Variables to hold D3-related objects
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let paths: d3.Selection<SVGPathElement, any, SVGGElement, unknown> | null = null
let projection: d3.GeoProjection | null = null
let pathGenerator: d3.GeoPath | null = null
let pinsGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let arcsGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null


// Function to add a single pin by city name
const addPin = (name: string) => {
  if (!pinsGroup || !projection) return
  const proj = projection

  // check if the pin already exists to prevent duplicates
  const existingPin = pinsGroup.selectAll<SVGCircleElement, unknown>('circle')
      .filter((d: any) => d.name === name)

  if (!existingPin.empty()) {
    console.warn(`Pin already exists: ${name}`)
    return
  }

  // Find the city by name
  const city = cities.value.find((city) => city.name === name)

  if (!city) {
    return
  }

  const [cx, cy] = proj(city.coordinates) || [0, 0]

  // Append a new circle for the pin
  pinsGroup.append('circle')
      .datum(city)
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 4) // Radius of the pin
      .attr('fill', '#B8336A')
      .attr('cursor', 'pointer')
}

// Function to add an arc between two cities by their names
const addArc = (sourceName: string, targetName: string) => {
  if (!arcsGroup || !projection || !pathGenerator) return

  const arcExists = arcsGroup.selectAll<SVGPathElement, unknown>('path')
      .filter(function() {
        const source = d3.select(this).attr('data-source')
        const target = d3.select(this).attr('data-target')
        return source === sourceName && target === targetName
      })
      .size() > 0

  if (arcExists) {
    console.warn(`Arc already exists: ${sourceName}-${targetName}`)
    return
  }

  // Find source and target cities
  const source = cities.value.find((city) => city.name === sourceName)
  const target = cities.value.find((city) => city.name === targetName)

  if (!source) {
    console.warn(`${sourceName} was not found in the list of cities`)
    return
  }

  if (!target) {
    console.warn(`${targetName} was not found in the list of cities`)
    return
  }


  const [x1, y1] = projection(source.coordinates) || [0, 0]
  const [x2, y2] = projection(target.coordinates) || [0, 0]

  // Calculate the midpoint for the control point to create an arc
  const dx = x2 - x1
  const dy = y2 - y1
  const dr = Math.sqrt(dx * dx + dy * dy) * 1.5 // Adjust the multiplier for arc height

  arcsGroup.append('path')
      .attr('data-source', sourceName)
      .attr('data-target', targetName)
      .attr('d', `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`)
      .attr('fill', 'none')
      .attr('stroke', '#FF5733')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7)
}

// Define the resize handler in the outer scope
const handleResize = debounce(() => {
  updateDimensions()
  if (!svg || !projection || !pathGenerator || !paths) return

  const { width, height } = dimensions
  const proj = projection

  // Update SVG attributes
  svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

  // Update projection
  projection
      .scale(width * 4) // Adjust the scale as needed
      .translate([width / 2, height / 2])

  // Update path generator with the new projection
  pathGenerator = d3.geoPath().projection(projection)

  // Update all paths with the new projection
  paths.attr('d', pathGenerator as any)

  // Update pins positions
  if (!pinsGroup) return
  pinsGroup.selectAll('circle')
      .attr('cx', (d: any) => proj(d.coordinates)![0])
      .attr('cy', (d: any) => proj(d.coordinates)![1])

  // Update arc positions
  if (!arcsGroup || !projection) return
  arcsGroup.selectAll<SVGPathElement, unknown>('path')
      .attr('d', function(this: SVGPathElement): string {
        const sourceName: string = d3.select(this).attr('data-source')
        const targetName: string = d3.select(this).attr('data-target')

        // Find the corresponding cities
        const source = cities.value.find((c) => c.name === sourceName)
        const target = cities.value.find((c) => c.name === targetName)

        if (!source || !target) {
          console.warn(`Cannot find cities: ${sourceName} or ${targetName}`)
          return ''
        }

        // Project the coordinates
        const [x1, y1] = proj(source.coordinates) || [0, 0]
        const [x2, y2] = proj(target.coordinates) || [0, 0]

        // Calculate the radius for the arc
        const dx = x2 - x1
        const dy = y2 - y1
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5

        return `M${x1},${y1} A${dr},${dr} 0 0,1 ${x2},${y2}`
      })
}, 100)

onMounted(async () => {
  // Initialize dimensions
  updateDimensions()
  const { width, height } = dimensions

  if (!svgRef.value || !tooltip.value) {
    console.error('SVG or tooltip element not found.')
    return
  }

  // Select the SVG element using D3
  svg = d3
      .select(svgRef.value)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

  // Define projection and path generator
  projection = d3.geoMercator()
      .center([10.5, 50]) // Center on Germany [longitude, latitude]
      .scale(2000) // Adjust the scale as needed
      .translate([width / 2, height / 2])

  pathGenerator = d3.geoPath().projection(projection)

  try {
    const topoData = await d3.json('/germany.json') as Topology
    const geoData = feature(topoData, topoData.objects.states) as d3.GeoPermissibleObjects

    g = svg.append('g')

    paths = g.selectAll('path')
        .data((geoData as any).features)
        .enter()
        .append('path')
        .attr('d', pathGenerator as any)
        .attr('fill', '#759FBC')
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.1)

    // Extract cities from TopoJSON
    if (topoData.objects.places) {
      const citiesGeo = feature(topoData, topoData.objects.places) as any
      cities.value = citiesGeo.features.map((feature: any) => ({
        name: feature.properties.name,
        coordinates: feature.geometry.coordinates
      }))
    } else {
      console.warn('No cities object found in TopoJSON.')
    }

    // Create a group for pins
    pinsGroup = svg.append('g').attr('class', 'pins')

    // Add pins
    addPin('Duisburg')
    addPin('Berlin')
    addPin('München')
    addPin('Oldenburg')

    // Create a group for arcs
    arcsGroup = svg.append('g').attr('class', 'arcs')

    // Add arcs
    addArc('Berlin', 'Duisburg')
    addArc('München', 'Duisburg')
    addArc('München', 'Oldenburg')


    // Add zoom behavior
    svg.call(
        d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
              if (g) {
                g.attr('transform', event.transform)
              }
              if (pinsGroup) {
                pinsGroup.attr('transform', event.transform)
              }
              if (arcsGroup) {
                arcsGroup.attr('transform', event.transform)
              }
            })
    )

    // Add the resize event listener
    window.addEventListener('resize', handleResize)

  } catch (error) {
    console.error('Error loading or processing TopoJSON data:', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.map-container {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

svg {
  width: 100%;
  height: 100%;
}

.tooltip {
  position: absolute;
  text-align: center;
  padding: 6px;
  font: 12px sans-serif;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  pointer-events: none;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s, left 0.3s, top 0.3s;
  white-space: nowrap;
  z-index: 10;
}
</style>
