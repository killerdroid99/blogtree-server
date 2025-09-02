import { NextFunction, Request, Response } from 'express';

const authGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }
  next();
};

export default authGuard;
