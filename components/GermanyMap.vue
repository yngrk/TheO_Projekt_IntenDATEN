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

// Variables to hold D3-related objects
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null
let g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let paths: d3.Selection<SVGPathElement, any, SVGGElement, unknown> | null = null
let projection: d3.GeoProjection | null = null
let pathGenerator: d3.GeoPath | null = null

// Define the resize handler in the outer scope
const handleResize = debounce(() => {
  updateDimensions()
  if (!svg || !projection || !pathGenerator || !paths) return

  const { width, height } = dimensions

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
      .center([10.5, 51]) // Center on Germany [longitude, latitude]
      .scale(3000) // Adjust the scale as needed
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
        .attr('fill', '#cccccc')
        .attr('stroke', '#333333')
        .attr('stroke-width', 0.1)
        .on('mouseover', function(event, d: any) {
          d3.select(this).attr('fill', '#aaaaaa')

          if (tooltip.value) {
            tooltip.value.style.opacity = '1'
            tooltip.value.innerHTML = d.properties.name
            const [x, y] = d3.pointer(event, mapContainer.value)
            tooltip.value.style.left = `${x + 20}px`
            tooltip.value.style.top = `${y + 20}px`
          }
        })
        .on('mousemove', function(event) {
          if (tooltip.value) {
            const [x, y] = d3.pointer(event, mapContainer.value)
            tooltip.value.style.left = `${x + 20}px`
            tooltip.value.style.top = `${y + 20}px`
          }
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill', '#cccccc')
          if (tooltip.value) {
            tooltip.value.style.opacity = '0'
          }
        })

    // Add zoom behavior
    svg.call(
        d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
              if (g) {
                g.attr('transform', event.transform)
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
  transition: opacity 0.3s;
  white-space: nowrap;
}
</style>
