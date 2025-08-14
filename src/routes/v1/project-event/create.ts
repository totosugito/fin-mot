import type {FastifyPluginAsyncTypebox} from "@fastify/type-provider-typebox";
import {withErrorHandler} from "../../../utils/withErrorHandler.ts";
import {db} from "../../../db/index.ts";
import {sql} from 'drizzle-orm';
import {Type} from '@sinclair/typebox';
import {projectEvents, projects, EnumProjectEventType} from "../../../db/schema/index.ts";
import {and, eq} from 'drizzle-orm';
import {randomUUID} from "node:crypto";
import {computeEventCost} from "../../../services/project-event/update-cost.ts";

const projectEventRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/create',
    method: 'POST',
    schema: {
      tags: ['Project Event'],
      summary: 'Create a new project event',
      description: 'Create a new project event with the provided details',
      body: Type.Object({
        projectId: Type.String({format: 'uuid'}),
        parentId: Type.Optional(Type.String({format: 'uuid'})),
        name: Type.String(),
        description: Type.Optional(Type.String()),
        type: Type.Optional(Type.Enum(EnumProjectEventType)),
        sortOrder: Type.Optional(Type.Number({minimum: 0})),
        extra: Type.Optional(Type.Record(Type.String(), Type.Any()))
      }),
      // response: {
      //   201: Type.Object({
      //     success: Type.Boolean(),
      //     data: Type.Object({
      //       id: Type.String({format: 'uuid'}),
      //       projectId: Type.String({format: 'uuid'}),
      //       parentId: Type.Optional(Type.String({format: 'uuid'})),
      //       userId: Type.String({format: 'uuid'}),
      //       name: Type.String(),
      //       description: Type.Optional(Type.String()),
      //       type: Type.String(),
      //       sortOrder: Type.Number(),
      //       path: Type.String(),
      //       depth: Type.Number(),
      //       extra: Type.Optional(Type.Record(Type.String(), Type.Any())),
      //       createdAt: Type.String({format: 'date-time'}),
      //       updatedAt: Type.String({format: 'date-time'})
      //     })
      //   }),
      //   400: Type.Object({
      //     success: Type.Boolean(),
      //     message: Type.String()
      //   }),
      //   404: Type.Object({
      //     success: Type.Boolean(),
      //     message: Type.String()
      //   }),
      //   500: Type.Object({
      //     success: Type.Boolean(),
      //     message: Type.String()
      //   })
      // }
    },
    handler: withErrorHandler(async (req, reply) => {
      const {projectId, parentId, name, description, type, sortOrder, extra} = req.body as {
        projectId: string;
        parentId?: string;
        name: string;
        description?: string;
        type?: string;
        sortOrder?: number;
        extra?: Record<string, any>;
      };

      // Check if project exists
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId)
      });

      if (!project) {
        return reply.status(404).send({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      // If parentId is provided, verify it exists and belongs to the same project
      let parentPath = '';
      if (parentId) {
        const parent = await db.query.projectEvents.findFirst({
          where: and(
            eq(projectEvents.id, parentId),
            eq(projectEvents.projectId, projectId)
          ),
          columns: {
            path: true
          }
        });

        if (!parent) {
          return reply.status(404).send({
            success: false,
            message: 'Parent event not found or does not belong to this project'
          });
        }
        parentPath = parent.path;
      }

      const userId = req.session?.user?.id;

      // Generate a UUID for the path if needed
      const newId = randomUUID();
      const newPath = parentPath ? `${parentPath}.${newId}` : newId;

      // Create the new project event
      const [newEvent] = await db.insert(projectEvents).values({
        projectId,
        userId,
        parentId: parentId || null,
        name,
        description: description || null,
        type: type || EnumProjectEventType.folder,
        sortOrder: sortOrder || 0,
        path: sql`${newPath}::ltree`,
        extra: extra || {},
      }).returning({
        id: projectEvents.id,
      });

      if(!newEvent) {
        return reply.status(500).send({
          success: false,
          message: 'Failed to create project event'
        });
      }

      // Update the cost for the project
      if(parentId && type === EnumProjectEventType.folder) {
        await computeEventCost(newEvent.id);
      }
      else {
        await computeEventCost(newEvent.id);
      }

      // Return the new project event
      const event = await db.query.projectEvents.findFirst({
        where: eq(projectEvents.id, newEvent.id),
        columns: {
          id: true,
          projectId: true,
          parentId: true,
          userId: true,
          name: true,
          description: true,
          type: true,
          sortOrder: true,
          path: true,
          depth: true,
          extra: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if(!event) {
        return reply.status(500).send({
          success: false,
          message: 'Failed to create project event'
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          ...event,
          createdAt: event.createdAt!.toISOString(),
          updatedAt: event.updatedAt!.toISOString(),
        },
      });
    })
  });
};

export default projectEventRoutes;
