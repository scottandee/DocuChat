import type { Request, Response } from "express";
import { AppError } from "../lib/errors.ts";

export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
) {
    if (error instanceof AppError) {
        console.warn(
            `[${error.code}] ${error.message}`,
            error.details ? { details: error.details } : ""
        );
        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: !error.isOperational ? "Internal Server Error": error.message,
                ...(error.details && { details: error.details }),
            },
        });
    }

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(400).json({
            success: false,
            error: {
                code: "INVALID_JSON",
                message: "Invalid JSON payload",
            },
        });
        
    }

    console.error("Unhandled error: ", error);
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
    });
}