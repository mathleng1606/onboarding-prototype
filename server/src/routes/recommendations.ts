import type { FastifyPluginAsync } from 'fastify';
import { parse } from '../lib.ts';
import { recordEvent } from '../services/events.ts';
import { computeOnboarding, withOnboardingTracking } from '../services/onboarding.ts';
import { reloadPractitioner } from '../services/practitioners.ts';
import {
  createReco,
  deleteReco,
  getReco,
  listRecos,
  recoCreateSchema,
  recoListQuerySchema,
  recoPatchSchema,
  sendReco,
  updateReco,
} from '../services/recommendations.ts';
import { param, type RouteOptions } from './context.ts';

/** /api/practitioners/{uid}/recommendations */
export const recommendationRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => listRecos(db, req.practitioner, parse(recoListQuerySchema, req.query)));

  app.post('/', async (req, reply) => {
    const reco = createReco(db, req.practitioner, parse(recoCreateSchema, req.body));
    return reply.code(201).send(reco);
  });

  app.get('/:recoUid', async (req) => getReco(db, req.practitioner, param(req, 'recoUid')));

  app.patch('/:recoUid', async (req) =>
    updateReco(db, req.practitioner, param(req, 'recoUid'), parse(recoPatchSchema, req.body)),
  );

  app.delete('/:recoUid', async (req, reply) => {
    deleteReco(db, req.practitioner, param(req, 'recoUid'));
    return reply.code(204).send();
  });

  /** Returns the updated checklist too, so the front shows the new state without a second call. */
  app.post('/:recoUid/send', async (req) => {
    const p = req.practitioner;
    const recommendation = withOnboardingTracking(db, p, () => {
      const reco = sendReco(db, p, param(req, 'recoUid'));
      recordEvent(db, p.id, 'recommendation_sent', { recommendationUid: reco.uid, patientUid: reco.patient.uid, isTest: reco.isTest }, 'server');
      return reco;
    });
    return { recommendation, onboarding: computeOnboarding(db, reloadPractitioner(db, p)) };
  });
};
