export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SOLUM Officemate API',
    version: '1.0.0',
    description: 'REST API for SOLUM Officemate — booking, CMS, guests, events, assets, and more.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
          avatar_url: { type: 'string', nullable: true },
        },
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          room_code: { type: 'string' },
          capacity: { type: 'integer' },
          features: { type: 'array', items: { type: 'string' } },
          image_url: { type: 'string', nullable: true },
          color: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          room_id: { type: 'string' },
          user_id: { type: 'string' },
          booking_date: { type: 'string', format: 'date' },
          start_slot: { type: 'integer', description: '0=09:00, 1=09:30, …17=17:30' },
          end_slot: { type: 'integer', description: 'exclusive end, 1–18' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['confirmed', 'cancelled'] },
        },
      },
      ContentBlock: {
        type: 'object',
        properties: {
          storage_key: { type: 'string' },
          content: { type: 'string' },
          content_type: { type: 'string', enum: ['text', 'image', 'html'] },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          image_url: { type: 'string', nullable: true },
          event_date: { type: 'string', format: 'date' },
          is_published: { type: 'boolean' },
        },
      },
      Guest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          host_user_id: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          visit_date: { type: 'string', format: 'date' },
          visit_time: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'checked_in', 'cancelled'] },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT tokens + user', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'New access token', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
          401: { description: 'Invalid token' },
        },
      },
    },
    '/auth/logout': {
      post: { summary: 'Logout', tags: ['Auth'], responses: { 200: { description: 'OK' } } },
    },
    '/content': {
      get: {
        summary: 'Get multiple content blocks by keys',
        tags: ['Content'],
        parameters: [{ name: 'keys', in: 'query', required: true, schema: { type: 'string' }, description: 'Comma-separated storage keys' }],
        responses: { 200: { description: 'Map of key→value' } },
      },
    },
    '/content/{key}': {
      get: { summary: 'Get single content block', tags: ['Content'], parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Content block', content: { 'application/json': { schema: { $ref: '#/components/schemas/ContentBlock' } } } } } },
      patch: {
        summary: 'Update content block (admin)',
        tags: ['Content'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' }, content_type: { type: 'string' } } } } } },
        responses: { 200: { description: 'Updated block' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } },
      },
    },
    '/rooms': {
      get: { summary: 'List active rooms', tags: ['Rooms'], responses: { 200: { description: 'Room list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } } },
      post: { summary: 'Create room (admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { 201: { description: 'Created room' } } },
    },
    '/rooms/{id}': {
      patch: { summary: 'Update room (admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { 200: { description: 'Updated room' } } },
      delete: { summary: 'Soft delete room (admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/bookings': {
      get: { summary: 'Get bookings for a date', tags: ['Bookings'], security: [{ bearerAuth: [] }], parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Booking list' } } },
      post: { summary: 'Create booking', tags: ['Bookings'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, responses: { 201: { description: 'Created booking' }, 409: { description: 'Slot conflict' } } },
    },
    '/bookings/mine': {
      get: { summary: 'My bookings', tags: ['Bookings'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Booking list' } } },
    },
    '/bookings/{id}/cancel': {
      patch: { summary: 'Cancel booking', tags: ['Bookings'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Cancelled booking' } } },
    },
    '/events': {
      get: { summary: 'List published events', tags: ['Events'], responses: { 200: { description: 'Event list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Event' } } } } } } },
      post: { summary: 'Create event (admin)', tags: ['Events'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } }, responses: { 201: { description: 'Created event' } } },
    },
    '/events/{id}': {
      patch: { summary: 'Update event (admin)', tags: ['Events'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } }, responses: { 200: { description: 'Updated event' } } },
      delete: { summary: 'Delete event (admin)', tags: ['Events'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/guests': {
      get: { summary: 'List guests', tags: ['Guests'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Guest list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Guest' } } } } } } },
      post: { summary: 'Register guest', tags: ['Guests'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Guest' } } } }, responses: { 201: { description: 'Created guest' } } },
    },
    '/guests/{id}': {
      patch: { summary: 'Update guest', tags: ['Guests'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Updated guest' } } },
      delete: { summary: 'Delete guest', tags: ['Guests'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/support': {
      get: { summary: 'List support categories + items', tags: ['Support'], responses: { 200: { description: 'Support structure' } } },
    },
    '/asset-types': {
      get: { summary: 'List asset types', tags: ['Assets'], responses: { 200: { description: 'Asset type list' } } },
    },
    '/assets': {
      get: { summary: "List user's assets", tags: ['Assets'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Asset list' } } },
    },
    '/asset-requests': {
      get: { summary: 'List asset requests', tags: ['Assets'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Request list' } } },
      post: { summary: 'Submit asset request', tags: ['Assets'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { device_name: { type: 'string' }, device_model: { type: 'string' }, purpose: { type: 'string' }, prime_approval: { type: 'string' } } } } } }, responses: { 201: { description: 'Created request' } } },
    },
    '/users': {
      get: { summary: 'List users (admin)', tags: ['Users'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'User list' } } },
    },
    '/users/me': {
      get: { summary: 'Get current user', tags: ['Users'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } } },
    },
    '/team': {
      get: { summary: 'List visible team members', tags: ['Team'], responses: { 200: { description: 'Team list' } } },
    },
    '/building-info': {
      get: { summary: 'Get building info', tags: ['Building'], responses: { 200: { description: 'Building info' } } },
      patch: { summary: 'Update building info (admin)', tags: ['Building'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated info' } } },
    },
  },
};

/** Swagger UI HTML that loads from CDN */
export function swaggerUiHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SOLUM Officemate API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: '${specUrl}',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: 'BaseLayout',
    deepLinking: true,
  });
</script>
</body>
</html>`;
}
