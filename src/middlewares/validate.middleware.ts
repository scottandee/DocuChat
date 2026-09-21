import type { NextFunction, Request, Response } from "express";
import type z from "zod";

export function validate(schema: z.ZodObject) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if(!result.success) {
            const errors = result.error.issues.map((err) => ({
                field: err.path.slice(1).join("."),
                message: err.message,
            }));
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Request validation failed",
                    errors,
                }
            });
        }

        next();
    };
}