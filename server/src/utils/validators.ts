import { z } from "zod";

import { cardPriorities, cardStatuses, cardTypes } from "../types/cards.js";

const checklistItemSchema = z.object({
  label: z.string().min(1).max(120),
  completed: z.boolean().default(false)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal(""))
});

export const updateProjectSchema = createProjectSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one project field must be provided"
);

export const createCardSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  type: z.enum(cardTypes),
  priority: z.enum(cardPriorities),
  difficulty: z.number().int().min(1).max(10),
  xpValue: z.number().int().min(1).optional(),
  status: z.enum(cardStatuses).default("deck"),
  assigneeId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid(),
  tags: z.array(z.string().min(1).max(24)).max(10).default([]),
  checklist: z.array(checklistItemSchema).max(15).default([])
});

export const updateCardSchema = createCardSchema
  .omit({ projectId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one card field must be provided");

export const moveCardSchema = z.object({
  status: z.enum(cardStatuses)
});

export const assignCardSchema = z.object({
  assigneeId: z.string().uuid().nullable()
});
