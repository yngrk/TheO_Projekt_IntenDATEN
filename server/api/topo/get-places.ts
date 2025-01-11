import topoJsonDataService from "~/server/services/topoJsonDataService";
import {ErrorResponse, SuccessResponse} from "~/server/types";
export default defineEventHandler(async (event): Promise<SuccessResponse | ErrorResponse> => {
    try {
        const data = await topoJsonDataService.getPlacesList()
        return {
            success: true,
            data: data
        }
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to read Json file',
            error: error.message
        };
    }
});