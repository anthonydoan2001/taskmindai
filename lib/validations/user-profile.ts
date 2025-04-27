import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const workingDaySchema = z.object({
  start: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM'),
  end: z.string().regex(timeRegex, 'Invalid time format. Use HH:MM'),
  isWorkingDay: z.boolean()
});

export const workingDaysSchema = z.object({
  monday: workingDaySchema,
  tuesday: workingDaySchema,
  wednesday: workingDaySchema,
  thursday: workingDaySchema,
  friday: workingDaySchema,
  saturday: workingDaySchema,
  sunday: workingDaySchema
});

export const userSettingsSchema = z.object({
  militaryTime: z.boolean(),
  workType: z.enum(['full-time', 'part-time', 'freelance', 'student']),
  categories: z.array(z.string()).min(1, 'At least one category is required')
});

export const userProfileSchema = z.object({
  user_id: z.string(),
  email: z.string().email('Invalid email format'),
  settings: userSettingsSchema,
  working_days: workingDaysSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type WorkingDays = z.infer<typeof workingDaysSchema>; 