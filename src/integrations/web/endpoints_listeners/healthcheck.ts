import { Request, Response } from "express";

export const healthcheck = async (_req: Request, res: Response) => {
  res.sendStatus(200);
};
