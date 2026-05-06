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
    const buildings = await (prisma as any).building.findMany({ 
      include: { floors: true },
      orderBy: { order: 'asc' }
    });
    console.log(`[API] Found ${buildings.length} buildings`);
    return buildings;
  });

  fastify.put('/buildings/reorder', async (request) => {
    const { orders } = request.body as { orders: { id: string, order: number }[] };
    console.log('[API] Reordering buildings:', orders);
    try {
      for (const item of orders) {
        await (prisma as any).building.update({ 
          where: { id: item.id }, 
          data: { order: item.order } 
        });
      }
      console.log('[API] Buildings reordered successfully');
      
      // Broadcast update
      (fastify as any).io.emit('registry:buildings_reordered', orders);
      
      return { success: true };
    } catch (err) {
      console.error('[API] Building reorder error:', err);
      throw err;
    }
  });

  fastify.post('/buildings', async (request) => {
    console.log('[API] Creating building:', request.body);
    const { name, order, width } = request.body as { name: string, order?: number, width?: number };
    const building = await (prisma as any).building.create({ 
      data: { 
        name, 
        order: order || 0,
        width: width || 350
      },
      include: { floors: true }
    });
    
    // Broadcast creation
    (fastify as any).io.emit('registry:building_created', building);
    
    return building;
  });

  fastify.put('/buildings/:id', async (request) => {
    console.log('[API] Updating building:', request.params, request.body);
    const { id } = request.params as { id: string };
    const { name, width } = request.body as { name?: string, width?: number };
    const building = await (prisma as any).building.update({ 
      where: { id }, 
      data: { 
        ...(name !== undefined && { name }),
        ...(width !== undefined && { width })
      },
      include: { floors: true }
    });
    
    // Broadcast update
    (fastify as any).io.emit('registry:building_updated', building);
    
    return building;
  });

  fastify.delete('/buildings/:id', async (request) => {
    console.log('[API] Deleting building:', request.params);
    const { id } = request.params as { id: string };
    const result = await (prisma as any).building.delete({ where: { id } });
    
    // Broadcast deletion
    (fastify as any).io.emit('registry:building_deleted', { id });
    
    return result;
  });

  // --- FLOORS ---
  fastify.post('/floors', async (request) => {
    console.log('[API] Creating floor:', request.body);
    const { buildingId, number } = request.body as { buildingId: string, number: number };
    const floor = await (prisma as any).floor.create({ data: { buildingId, number } });
    (fastify as any).io.emit('registry:floor_created', floor);
    return floor;
  });

  fastify.put('/floors/:id', async (request) => {
    console.log('[API] Updating floor:', request.params, request.body);
    const { id } = request.params as { id: string };
    const { number } = request.body as { number: number };
    const floor = await (prisma as any).floor.update({ where: { id }, data: { number } });
    (fastify as any).io.emit('registry:floor_updated', floor);
    return floor;
  });

  fastify.delete('/floors/:id', async (request) => {
    console.log('[API] Deleting floor:', request.params);
    const { id } = request.params as { id: string };
    const result = await (prisma as any).floor.delete({ where: { id } });
    (fastify as any).io.emit('registry:floor_deleted', { id });
    return result;
  });

  // --- CABINETS ---
  fastify.get('/cabinets', async () => {
    console.log('[API] Fetching cabinets...');
    return (prisma as any).cabinet.findMany({ 
      include: { department: true, building: true, floor: true },
      orderBy: { order: 'asc' }
    });
  });

  fastify.put('/cabinets/reorder', async (request) => {
    const { orders } = request.body as { orders: { id: string, order: number }[] };
    console.log('[API] Reordering cabinets:', orders);
    try {
      for (const item of orders) {
        await (prisma as any).cabinet.update({ 
          where: { id: item.id }, 
          data: { order: item.order } 
        });
      }
      console.log('[API] Cabinets reordered successfully');
      (fastify as any).io.emit('registry:cabinets_reordered', orders);
      return { success: true };
    } catch (err) {
      console.error('[API] Cabinet reorder error:', err);
      throw err;
    }
  });

  fastify.post('/cabinets', async (request) => {
    console.log('[API] Creating cabinet:', request.body);
    const data = request.body as any;
    const cabinet = await (prisma as any).cabinet.create({ data });
    (fastify as any).io.emit('registry:cabinet_created', cabinet);
    return cabinet;
  });

  fastify.put('/cabinets/:id', async (request) => {
    console.log('[API] Updating cabinet:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const cabinet = await (prisma as any).cabinet.update({ where: { id }, data });
    (fastify as any).io.emit('registry:cabinet_updated', cabinet);
    return cabinet;
  });

  fastify.delete('/cabinets/:id', async (request) => {
    console.log('[API] Deleting cabinet:', request.params);
    const { id } = request.params as { id: string };
    const result = await (prisma as any).cabinet.delete({ where: { id } });
    (fastify as any).io.emit('registry:cabinet_deleted', { id });
    return result;
  });

  // --- DEPARTMENTS ---
  fastify.get('/departments', async () => {
    console.log('[API] Fetching departments...');
    return (prisma as any).department.findMany();
  });

  fastify.post('/departments', async (request) => {
    console.log('[API] Creating department:', request.body);
    const data = request.body as any;
    const department = await (prisma as any).department.create({ data });
    (fastify as any).io.emit('registry:department_created', department);
    return department;
  });

  fastify.put('/departments/:id', async (request) => {
    console.log('[API] Updating department:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const department = await (prisma as any).department.update({ where: { id }, data });
    (fastify as any).io.emit('registry:department_updated', department);
    return department;
  });

  fastify.delete('/departments/:id', async (request) => {
    console.log('[API] Deleting department:', request.params);
    const { id } = request.params as { id: string };
    const result = await (prisma as any).department.delete({ where: { id } });
    (fastify as any).io.emit('registry:department_deleted', { id });
    return result;
  });

  // --- EQUIPMENT ---
  fastify.get('/equipment', async () => {
    console.log('[API] Fetching equipment...');
    return (prisma as any).equipment.findMany({ include: { cabinet: true, department: true } });
  });

  fastify.post('/equipment', async (request) => {
    console.log('[API] Creating equipment:', request.body);
    const data = request.body as any;
    const equipment = await (prisma as any).equipment.create({ 
      data,
      include: { cabinet: true, department: true }
    });
    
    // Broadcast creation
    (fastify as any).io.emit('registry:equipment_created', equipment);
    
    return equipment;
  });

  fastify.put('/equipment/:id', async (request) => {
    console.log('[API] Updating equipment:', request.params, request.body);
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const equipment = await (prisma as any).equipment.update({ 
      where: { id }, 
      data,
      include: { cabinet: true, department: true }
    });
    
    // Broadcast update
    (fastify as any).io.emit('registry:equipment_updated', equipment);
    
    return equipment;
  });

  fastify.delete('/equipment/:id', async (request) => {
    console.log('[API] Deleting equipment:', request.params);
    const { id } = request.params as { id: string };
    const result = await (prisma as any).equipment.delete({ where: { id } });
    
    // Broadcast deletion
    (fastify as any).io.emit('registry:equipment_deleted', { id });
    
    return result;
  });
}
