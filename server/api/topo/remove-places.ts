import {H3Error} from "h3";
import topoJsonDataService from "~/server/services/topoJsonDataService";

export default defineEventHandler(async (event) => {
    if (event.node.req.method !== 'POST') {
        sendError(event, {
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
            message: "Only POST requests are allowed"
        } as H3Error)
        return
    }

    try {
        const body = await readBody(event)
        if (!body || !Array.isArray(body.ids)) {
            sendError(event, {
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'Request body must contain an array of IDs under the "ids" key.'
            } as H3Error)
            return
        }

        const {ids} = body

        if (!ids.every((id: any) => typeof id === 'string')) {
            sendError(event, {
                statusCode: 400,
                statusMessage: 'Bad Request',
                message: 'All IDs must be strings.'
            } as H3Error)
            return
        }

        await topoJsonDataService.deletePlaces(ids)

        return {
            success: true,
            data: [`Successfully deleted ${ids.length} places`]
        }
    } catch (error: any) {
        if (error.statusCode && error.message) {
            return {
                success: false,
                message: error.statusMessage,
                error: error.message
            }
        }

        return {
            success: false,
            message: 'Internal Server Error',
            error: error.message || 'An unexpected error occurred.',
        }
    }
})