import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyPrivyTokenJWKS } from '../middleware/jwks-auth';

const actionRoutes = new Hono<{ Bindings: Env }>();

actionRoutes.get('/', async (c) => {

});


actionRoutes.post('', verifyPrivyTokenJWKS, async (c) => {
})


export default actionRoutes;