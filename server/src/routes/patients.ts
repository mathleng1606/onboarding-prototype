import type { FastifyPluginAsync } from 'fastify';
import { parse } from '../lib.ts';
import { withOnboardingTracking } from '../services/onboarding.ts';
import { createPatient, deletePatient, findPatient, listPatients, patientCreateSchema, toPatientDto } from '../services/patients.ts';
import { listRecos } from '../services/recommendations.ts';
import { param, type RouteOptions } from './context.ts';

/** /api/practitioners/{uid}/patients */
export const patientRoutes: FastifyPluginAsync<RouteOptions> = async (app, { db }) => {
  app.get('/', async (req) => listPatients(db, req.practitioner));

  app.post('/', async (req, reply) => {
    const input = parse(patientCreateSchema, req.body);
    const patient = withOnboardingTracking(db, req.practitioner, () => createPatient(db, req.practitioner, input));
    return reply.code(201).send(toPatientDto(patient));
  });

  app.get('/:patientUid', async (req) => {
    const patient = findPatient(db, req.practitioner, param(req, 'patientUid'));
    return { ...toPatientDto(patient), recommendations: listRecos(db, req.practitioner, { patientUid: patient.uid }) };
  });

  app.delete('/:patientUid', async (req, reply) => {
    deletePatient(db, req.practitioner, param(req, 'patientUid'));
    return reply.code(204).send();
  });
};
