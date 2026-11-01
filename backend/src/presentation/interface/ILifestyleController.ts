import type { Request, Response } from "express";

export interface ILifestyleController {
    saveLifestyle(req: Request, res: Response): Promise<void>;
    getLifestyle(req: Request, res: Response): Promise<void>;
}
