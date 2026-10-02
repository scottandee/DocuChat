import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_JSON",
                message: "Invalid JSON payload",
            },
        });
        
    }

    if (error instanceof AppError) {
        const logData = {
            correlationId: req.correlationId,
            code: error.code,
            statusCode: error.statusCode,
            isOperational: error.isOperational,
            details: error.details,
            stack: error.stack,
        }
        if (error.isOperational) {
            logger.warn(error.message, logData);
        } else {
            logger.error("Unexpected application error", {
                ...logData,
                message: error.message,
            });
        }
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: !error.isOperational ? "Internal Server Error": error.message,
                ...(error.details ? { details: error.details } : {}),
            },
        });
    }    

    logger.error("Unhandled error: ", {
        correlationId: req.correlationId,
        message: error.message,
        stack: error.stack,
    });

    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
    });
}