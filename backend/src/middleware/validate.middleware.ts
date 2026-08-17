import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.reduce((acc: any, curr) => {
          const field = curr.path.slice(1).join('.');
          acc[field || 'request'] = curr.message;
          return acc;
        }, {});
        return next(new ValidationError('Validation failed', formattedErrors));
      }
      next(error);
    }
  };
};
