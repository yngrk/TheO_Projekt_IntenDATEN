import path from "node:path";
import {promises as fs} from 'fs'
import {PlaceGeometry, TopoJsonData} from "~/server/types";

class TopoJsonDataService {
    private data: TopoJsonData | null = null
    private filePath: string
    private lastModified: Date | null = null

    constructor(relativePath: string) {
        this.filePath = path.resolve(relativePath)
    }

    private async loadData(): Promise<void> {
        try {
            await fs.access(this.filePath)
            const stats = await fs.stat(this.filePath)

            if (this.lastModified && stats.mtime <= this.lastModified) {
                return
            }

            const fileContent = await fs.readFile(this.filePath, 'utf-8')
            const topoData: TopoJsonData = JSON.parse(fileContent)

            if (
                !topoData.objects ||
                !topoData.objects.places ||
                topoData.objects.places.type !== "GeometryCollection"
            ) {
                throw new Error("'places' GeometryCollection not found in TopoJson")
            }

            this.data = topoData
            this.lastModified = stats.mtime
            console.log('TopoJSON data loaded and cached')
        } catch (error) {
            console.error('Error loading TopoJSON data:', error)
        }
    }

    public async getData(): Promise<TopoJsonData> {
        if (!this.data) {
            await this.loadData()
        } else {
            const stats = await fs.stat(this.filePath)
            if (this.lastModified && stats.mtime > this.lastModified) {
                await this.loadData()
            }
        }
        return this.data!
    }

    public async getPlacesList(): Promise<PlaceGeometry[]> {
        try {
            const data = await this.getData()
            if (
                !data.objects.places
                || data.objects.places.type !== "GeometryCollection"
            ) {
                throw new Error("'places' GeometryCollection not found in TopoJSON data")
            }

            const places = data.objects.places.geometries as PlaceGeometry[]

            console.log(`Retrieved ${places.length} places from TopoJSON data`)
            return places
        } catch (error) {
            console.error("Error retrieving places list:", error)
            throw error;
        }
    }

    public async deletePlaces(ids: string[]): Promise<void>{
        try {
            if (!Array.isArray(ids) || ids.length === 0) {
                throw new Error("IDs array must be a non-empty array of strings")
            }

            const data = await this.getData()
            const geometries = data.objects.places.geometries as PlaceGeometry[]

            const initialCount = geometries.length
            const remainingGeometries = geometries.filter((place) => !ids.includes(place.id))
            const removedCount = initialCount - remainingGeometries.length

            if (removedCount === 0) {
                console.log('No matching places found to delete')
                return
            }

            data.objects.places.geometries = remainingGeometries

            console.log(`Deleted ${removedCount} place(s) with IDs: ${ids.join(',')}`)

            const updatedContent = JSON.stringify(data,null, 2)
            await fs.writeFile(this.filePath, updatedContent, 'utf-8')
            console.log('TopoJSON data saved to file')

            this.data = data
            const stats = await fs.stat(this.filePath)
            this.lastModified = stats.mtime
        } catch (error) {
            console.error("Error deleting places:", error)
            throw error
        }
    }

    public async addPlace(newPlace: PlaceGeometry): Promise<void> {
        try {
            const data = await this.getData()

            if (!newPlace
                || newPlace.type !== 'Point'
                || !Array.isArray(newPlace.coordinates)
                || newPlace.coordinates.length !== 2
            ) {
                throw new Error("Invalid PlaceGeometry object")
            }

            const existingPlace = (data.objects.places.geometries as PlaceGeometry[])
                .find((place) => place.id === newPlace.id)
            if (existingPlace) {
                throw new Error(`Place with id "${newPlace.id}" already exists`)
            }

            (data.objects.places.geometries as PlaceGeometry[]).push(newPlace)
            console.log(`Added new place with id "${newPlace.id}"`)

            const updatedContent = JSON.stringify(data, null, 2)
            await fs.writeFile(this.filePath, updatedContent, 'utf-8')
            console.log('TopoJSON data saved to file')

            this.data = data
            const stats = await fs.stat(this.filePath)
            this.lastModified = stats.mtime
        } catch (error) {
            console.error("Error adding new place:", error)
            throw error
        }
    }
}

const topoJsonDataService = new TopoJsonDataService('public/germany.json')
export default topoJsonDataService