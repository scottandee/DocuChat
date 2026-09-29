import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";

export function conditionalGet() {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalJson = res.json.bind(res);

        res.json = function (body) {
            const content = JSON.stringify(body);
            const etag = `${crypto
                .createHash("sha256")
                .update(content)
                .digest("hex")
            }`;
            res.setHeader('ETag', etag);
            
            const clientEtag = req.headers["if-none-match"];
            if (clientEtag === etag) {
                res.status(304).end();
                return res;
            }
            return originalJson(body);
        }
        next();
    };
}