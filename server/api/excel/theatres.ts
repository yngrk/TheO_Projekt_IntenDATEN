import excelDataService from "~/server/services/excelDataService";
import {ErrorResponse, SuccessResponse} from "~/server/types";
export default defineEventHandler(async (event): Promise<SuccessResponse | ErrorResponse> => {
    try {
        const query = getQuery(event);
        const typeParam = query.type as string | undefined;

        let data = await excelDataService.getData();

        switch (typeParam) {
            case 'city':
                data = data.filter((o) => o.Theater === 'Stadttheater')
                break
            case 'regional':
                data = data.filter((o) => o.Theater === 'Landestheater')
                break
            case 'state':
                data = data.filter((o) => o.Theater === 'Staatstheater')
                break
            case 'private':
                data = data.filter((o) => o.Theater === 'Privattheater')
        }

        const theatres = data
            .map((o ) => {
            return {
                name: o.Haus,
                state: o.BL,
                region: o["Ost / West"],
                legalStruct: o.Rechtsform,
                city: o.Stadt,
                type: o.Theater
            }
        })

        return {
            success: true,
            data: theatres
        }
    } catch (error: any) {
        console.error('Error reading Excel file:', error);
        return {
            success: false,
            message: 'Failed to read Excel file',
            error: error.message
        };
    }
});