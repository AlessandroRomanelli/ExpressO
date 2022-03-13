import { Method } from './Method';
import { ResponseType } from './ResponseType';
import { Request, Response } from 'express-serve-static-core';
import http from 'http';

export type ExpressHandlerFunction = (req: Request | http.IncomingMessage, res: Response | http.ServerResponse) => any;

export interface Endpoint {
  readonly method: Method;
  readonly path: string;
  readonly responses: ResponseType[];
  readonly handlers: ExpressHandlerFunction[];
}
