import type { FastifyPluginAsync } from 'fastify';
import { parse } from '../lib.ts';
import { withOnboardingTracking } from '../services/onboarding.ts';
import { addFavorite, listProducts, productQuerySchema, removeFavorite } from '../services/products.ts';
import { param, type RouteOptions } from './context.ts';

/** /api/practitioners/{uid}/products — prices use the practitioner's discount, rankings their profession. */
export const productRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => listProducts(db, req.practitioner, parse(productQuerySchema, req.query)));
};

/** /api/practitioners/{uid}/favorites */
export const favoriteRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => listProducts(db, req.practitioner, { favoritesOnly: true }));

  app.put('/:productUid', async (req, reply) => {
    withOnboardingTracking(db, req.practitioner, () => addFavorite(db, req.practitioner, param(req, 'productUid')));
    return reply.code(204).send();
  });

  app.delete('/:productUid', async (req, reply) => {
    removeFavorite(db, req.practitioner, param(req, 'productUid'));
    return reply.code(204).send();
  });
};
