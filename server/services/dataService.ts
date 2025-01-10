import path from "node:path"
import { promises as fs } from 'fs'
import Exceljs from "exceljs";

interface DataItem {
    [key: string]: any
}

class DataService {
    private data: DataItem[] | null = null
    private filePath: string
    private lastModified: Date | null = null

    constructor(relativePath: string) {
        this.filePath = path.resolve(relativePath)
    }

    private hasValues(row: Exceljs.Row): row is Exceljs.Row & { values: any[] } {
        return Array.isArray(row.values);
    }

    private async loadData(): Promise<void> {
        try {
            await fs.access(this.filePath)
            const stats = await fs.stat(this.filePath)

            if (this.lastModified && stats.mtime <= this.lastModified) {
                return
            }

            const workbook = new Exceljs.Workbook()
            await workbook.xlsx.readFile(this.filePath)
            const worksheet = workbook.worksheets[0]
            const data: DataItem[] = []
            let headers: string[] = []

            worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
                if (!this.hasValues(row)) {
                    console.warn(`Row ${rowNum} has no values.`);
                    return;
                }

                if (rowNum === 1) {
                    headers = row.values.slice(1) as string[]
                } else {
                    const rowData: DataItem = {}
                    row.values.slice(1).forEach((cell: any, index: number) => {
                        rowData[headers[index]] = cell
                    })
                    data.push(rowData)
                }
            })

            this.data = data
            this.lastModified = stats.mtime
            console.log('Excel data loaded and cached')
        } catch (error) {
            console.error('Error loading Excel data', error)
            throw error
        }
    }

    public async getData(): Promise<DataItem[]> {
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
}

const dataService = new DataService('server/data/src/Tabelle_IntenDATEN_2025.xlsx');
export default dataService;