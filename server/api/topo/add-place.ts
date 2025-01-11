import {PlaceGeometry, SuccessResponse} from "~/server/types";
import topoJsonDataService from "~/server/services/topoJsonDataService";

export default defineEventHandler(async (event) => {
    if (event.node.req.method !== 'POST') {
        throw createError({
            statusCode: 405,
            statusMessage: 'Method not allowed',
            message: 'Only POST method is allowed'
        })
    }

    try {
        const body = await readBody(event)

        const validationError = validatePlaceGeometry(body)
        if (validationError) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Invalid PlaceGeometry object.',
                data: validationError,
            });
        }

        const newPlace: PlaceGeometry = body;

        await topoJsonDataService.addPlace(newPlace);

        const successResponse: SuccessResponse = {
            success: true,
            data: ['Place added successfully.'],
        };

        return successResponse
    } catch (error: any) {
        return {
            success: false,
            message: 'Internal Server Error',
            error: (error as Error).message || 'An unexpected error occurred.',
        }
    }
})

function validatePlaceGeometry(obj: any): string | null {
    if (typeof obj !== 'object' || obj === null) {
        return 'PlaceGeometry must be an object'
    }

    const {type, coordinates, properties, id} = obj

    if (type !== 'Point') {
        return "Property 'type' must be 'Point'"
    }

    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every((num: any) => typeof num === 'number')
    ) {
        return "Property 'coordinates' must be an array of two numbers [lon, lat]"
    }

    const { name, nameEN, state } = properties;

    if (typeof name !== 'string' || name.trim() === '') {
        return "Property 'properties.name' must be a non-empty string.";
    }

    if (nameEN !== null && typeof nameEN !== 'string') {
        return "Property 'properties.nameEN' must be a string or null.";
    }

    if (typeof state !== 'string' || state.trim() === '') {
        return "Property 'properties.state' must be a non-empty string.";
    }

    if (typeof id !== 'string' || id.trim() === '') {
        return "Property 'id' must be a non-empty string.";
    }

    return null; // No errors
}