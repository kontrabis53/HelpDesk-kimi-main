import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

export default async function registryRoutes(fastify: FastifyInstance) {
  // --- TEST ---
  fastify.get('/test', async () => {
    return { message: 'Registry API is working', timestamp: new Date().toISOString() };
  });

  // --- BUILDINGS ---
  fastify.get('/buildings', async () => {
    console.log('[API] Fetching buildings...');
    const buildings = await (prisma as any).building.findMany({ include: { floors: true } });
    console.log(`[API] Found ${buildings.length} buildings`);
    return buildings;
  });

  fastify.post('/buildings', async (request) => {
    console.log('[API] Creating building:', request.body);
    const { name } = request.body as { name: string };
    return (prisma as any).building.create({ data: { name } });
  });

  fastify.put('/buildings/:id', async (request) => {
    console.log('[API] Updating building:', request.params, request.body);
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };
    return (prisma as any).building.update({ where: { id }, data: { name } });
  });

  fastify.delete('/buildings/:id', async (request) => {
    console.log('[API] Deleting building:', request.params);
    const { id } = request.params as { id: string };
    return (prisma as any).building.delete({ where: { id } });
  });

  // --- FLOORS ---
  fastify.post('/floors', async (request) => {
    console.log('[API] Creating floor:', request.body);
    const { buildingId, number } = request.body as { buildingId: string, number: number };
    return (prisma as any).floor.create({ data: { buildingId, number } });
  });

  fastify.delete('/floors/:id', async (request) => {
    console.log('[API] Deleting floor:', request.params);
    const { id } = request.params as { id: string };
    return (prisma as any).floor.delete({ where: { id } });
  });

  // --- CABINETS ---
  fastify.get('/cabinets', async () => {
    console.log('[API] Fetching cabinets...');
    return (prisma as any).cabinet.findMany({ include: { department: true, building: true, floor: true } });
  });

  fastify.post('/cabinets', async (request) => {
    console.log('[API] Creating cabinet:', request.body);
    const data = request.body as any;
    return (prisma as any).cabinet.create({ data });
  });

  fastify.put('/cabinets/:id', async (request) => {
    console.log('[API] Updating cabinet:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    return (prisma as any).cabinet.update({ where: { id }, data });
  });

  fastify.delete('/cabinets/:id', async (request) => {
    console.log('[API] Deleting cabinet:', request.params);
    const { id } = request.params as { id: string };
    return (prisma as any).cabinet.delete({ where: { id } });
  });

  // --- DEPARTMENTS ---
  fastify.get('/departments', async () => {
    console.log('[API] Fetching departments...');
    return (prisma as any).department.findMany();
  });

  fastify.post('/departments', async (request) => {
    console.log('[API] Creating department:', request.body);
    const data = request.body as any;
    return (prisma as any).department.create({ data });
  });

  fastify.put('/departments/:id', async (request) => {
    console.log('[API] Updating department:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    return (prisma as any).department.update({ where: { id }, data });
  });

  fastify.delete('/departments/:id', async (request) => {
    console.log('[API] Deleting department:', request.params);
    const { id } = request.params as { id: string };
    return (prisma as any).department.delete({ where: { id } });
  });

  // --- EQUIPMENT ---
  fastify.get('/equipment', async () => {
    console.log('[API] Fetching equipment...');
    return (prisma as any).equipment.findMany({ include: { cabinet: true, department: true } });
  });

  fastify.post('/equipment', async (request) => {
    console.log('[API] Creating equipment:', request.body);
    const data = request.body as any;
    return (prisma as any).equipment.create({ data });
  });

  fastify.put('/equipment/:id', async (request) => {
    console.log('[API] Updating equipment:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    return (prisma as any).equipment.update({ where: { id }, data });
  });

  fastify.delete('/equipment/:id', async (request) => {
    console.log('[API] Deleting equipment:', request.params);
    const { id } = request.params as { id: string };
    return (prisma as any).equipment.delete({ where: { id } });
  });
}
