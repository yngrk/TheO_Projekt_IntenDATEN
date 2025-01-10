import dataService from "~/server/services/dataService";

interface SuccessResponse {
    success: true;
    data: any[];
}

interface ErrorResponse {
    success: false;
    message: string;
    error: string;
}

export default defineEventHandler(async (event): Promise<SuccessResponse | ErrorResponse> => {
    try {
        const data = await dataService.getData();
        return {
            success: true,
            data
        };
    } catch (error: any) {
        console.error('Error reading Excel file:', error);
        return {
            success: false,
            message: 'Failed to read Excel file',
            error: error.message
        };
    }
});