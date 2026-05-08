import { z } from "zod";

import { cardDifficulties, cardPriorities } from "../types/cards.js";
import { deckColors } from "../types/decks.js";

const checklistItemSchema = z.object({
  label: z.string().min(1).max(120),
  completed: z.boolean().default(false)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(50)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const updateProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(40).optional(),
    lastName: z.string().trim().min(1).max(40).optional(),
    statusMessage: z.string().trim().max(140).optional().or(z.literal("")),
    avatarUrl: z.string().trim().url().optional().or(z.literal(""))
  })
  .refine((data) => Object.keys(data).length > 0, "At least one profile field must be provided");

export const createProjectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal(""))
});

export const updateProjectSchema = createProjectSchema.extend({
  isPublic: z.boolean().optional()
}).partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one project field must be provided"
);

export const createCardSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  priority: z.enum(cardPriorities),
  difficulty: z.enum(cardDifficulties),
  assigneeId: z.string().uuid().optional().nullable(),
  boardSlot: z.number().int().min(0).max(4).optional().nullable(),
  deckId: z.string().uuid(),
  projectId: z.string().uuid(),
  tags: z.array(z.string().min(1).max(24)).max(10).default([]),
  checklist: z.array(checklistItemSchema).max(15).default([])
});

export const updateCardSchema = createCardSchema
  .omit({ projectId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one card field must be provided");

export const assignCardSchema = z.object({
  assigneeId: z.string().uuid().nullable()
});

const deckPermissionModes = ["FULL_ACCESS", "NO_ACCESS", "WHITELIST", "BLACKLIST"] as const;

export const setMemberPermissionsSchema = z.object({
  role: z.enum(["MEMBER", "ADMIN"]),
  deckReadMode: z.enum(deckPermissionModes),
  deckReadDeckIds: z.array(z.string().uuid()).max(200).default([]),
  deckWriteMode: z.enum(deckPermissionModes),
  deckWriteDeckIds: z.array(z.string().uuid()).max(200).default([])
});

const XP_PAYOUT_VALUES = [0, 25, 50, 75, 100] as const;
const xpPayoutSchema = z.number().int().refine((v) => (XP_PAYOUT_VALUES as readonly number[]).includes(v), {
  message: "xpPayout must be 0, 25, 50, 75, or 100"
});

export const createDeckSchema = z.object({
  projectId: z.string().uuid(),
  completionTargetDeckId: z.string().uuid().optional(),
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal("")),
  icon: z.string().max(64).optional().or(z.literal("")),
  color: z.enum(deckColors).default("teal"),
  isAccessible: z.boolean().default(true),
  allowAssignment: z.boolean().default(true),
  xpPayout: xpPayoutSchema.default(0)
});

export const updateDeckSchema = createDeckSchema
  .omit({ projectId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one deck field must be provided");
