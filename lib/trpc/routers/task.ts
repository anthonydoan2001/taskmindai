import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import type { Context } from "../../trpc/context";
import { TRPCError } from "@trpc/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { publicProcedure } from '../trpc';
import { TaskCreateInput } from '@/types/task';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
interface Category {
  id: string;
  name: string;
  color?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  user_id: string;
  created_at: string;
  updated_at: string;
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  is_all_day: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.enum(['work', 'personal', 'study', 'other']),
});

type TaskInput = z.infer<typeof taskSchema>;
const taskUpdateSchema = taskSchema.partial();
type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export const taskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('tasks')
        .insert({
          ...input,
          user_id: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      ...taskSchema.partial().shape
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const { id, ...updates } = input;
      const { data, error } = await ctx.supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', ctx.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const { error } = await ctx.supabase
        .from('tasks')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.user.id);

      if (error) throw error;
      return true;
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('tasks')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const { data, error } = await ctx.supabase
        .from('tasks')
        .select('*')
        .eq('id', input.id)
        .eq('user_id', ctx.user.id)
        .single();

      if (error) throw error;
      return data;
    }),

  processInput: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }: { input: string }) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a task parser that extracts structured information from natural language input.
              Extract the following information if present:
              - Task title (required)
              - Description (optional)
              - Due date and time (optional)
              - Priority level (low, medium, high) (optional)
              - Categories (optional)
              
              Format the response as JSON with these fields. Infer reasonable values when possible.
              If a specific time isn't mentioned but it's a common task, use typical timing.`,
            },
            {
              role: "user",
              content: input,
            },
          ],
        });

        const result = completion.choices[0]?.message?.content;
        if (!result) {
          throw new Error("No response from AI");
        }

        return JSON.parse(result);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process task input",
          cause: error,
        });
      }
    }),
});

// Add this at the end of the file
const getAllInput = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().optional(),
}).optional(); 