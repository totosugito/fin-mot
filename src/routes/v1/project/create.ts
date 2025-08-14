import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { withErrorHandler } from "../../../utils/withErrorHandler.ts";
import { db } from '../../../db/index.ts';
import { Type } from '@sinclair/typebox';
import {EnumProjectStatus, projects} from "../../../db/schema/index.ts";
import { and, eq } from 'drizzle-orm';

const projectRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.route({
    url: '/create',
    method: 'POST',
    schema: {
      tags: ['Project'],
      summary: 'Create a new project',
      description: 'Create a new project with the provided details',
      body: Type.Object({
        name: Type.String(),
        description: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            status: Type.String(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        409: Type.Object({
          success: Type.Boolean(),
          message: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        })
      }
    },
    handler: withErrorHandler(async (req, reply) => {
      const { name, description} = req.body as {
        name: string;
        description?: string;
      };

      const userId = req.session?.user?.id;

      // Check if project with the same name already exists for this user
      const existingProject = await db.query.projects.findFirst({
        where: and(
          eq(projects.userId, userId),
          eq(projects.name, name)
        ),
      });

      if (existingProject) {
        return reply.status(409).send({
          success: false,
          message: 'A project with this name already exists',
        });
      }

      // Create the new project
      const [newProject] = await db.insert(projects).values({
        userId,
        name,
        description: description || null,
        status: EnumProjectStatus.draft,
      }).returning({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      });

      return reply.status(201).send({
        success: true,
        data: {
          ...newProject,
          createdAt: newProject.createdAt!.toISOString(),
          updatedAt: newProject.updatedAt!.toISOString(),
        },
      });
    })
  });
};

export default projectRoutes;
