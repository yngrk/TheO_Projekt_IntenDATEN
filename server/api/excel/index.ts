import excelDataService from "~/server/services/excelDataService";

export default defineEventHandler(async (event): Promise<SuccessResponse | ErrorResponse> => {
    try {
        const data = await excelDataService.getData();
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