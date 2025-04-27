import { z } from "zod";
import { router, protectedProcedure } from "../trpc-helpers";

const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  recurrence: z.record(z.any()).optional(),
  ai_generated: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export const scheduleRouter = router({
  /**
   * List schedules for the current user (paginated)
   */
  list: protectedProcedure.input(paginationSchema.optional()).query(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { page = 1, pageSize = 20 } = input || {};
    const { data, error, count } = await supabase
      .from("schedules")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("start_time", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(error.message);
    return {
      data,
      page,
      pageSize,
      total: count,
      totalPages: count ? Math.ceil(count / pageSize) : 1,
    };
  }),

  /**
   * Get a single schedule by id
   */
  get: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", input.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }),

  /**
   * Create a new schedule
   */
  create: protectedProcedure.input(scheduleSchema.omit({ id: true, created_at: true, updated_at: true })).mutation(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { error } = await supabase
      .from("schedules")
      .insert([{ ...input, user_id: userId, ai_generated: input.ai_generated ?? true }]);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * Update a schedule
   */
  update: protectedProcedure.input(scheduleSchema).mutation(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    if (!input.id) throw new Error("Missing schedule id");
    const { error } = await supabase
      .from("schedules")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * Delete a schedule
   */
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", input.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * Generate schedule from natural language (calls OpenAI, returns events)
   */
  generateFromNaturalLanguage: protectedProcedure.input(z.object({ prompt: z.string() })).mutation(async ({ ctx, input }) => {
    // TODO: Integrate with OpenAI or your AI service
    // For now, return a mock event
    return {
      events: [
        {
          title: "Mock Event",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          ai_generated: true,
        },
      ],
      prompt: input.prompt,
    };
  }),
});

export default scheduleRouter; 