import { z } from "zod";
import { router, protectedProcedure } from "../trpc-helpers";
import type { UserPreferences } from "@/types/user";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

// --- Zod Schemas ---
const preferencesSchema = z.object({
  militaryTime: z.boolean().default(false),
  workType: z.enum(['full-time', 'part-time']).default('full-time'),
  categories: z.array(z.string()).default([]),
  notifications: z.record(z.any()).optional(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
});

const workScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  day: z.enum([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  is_active: z.boolean().default(true),
  timezone: z.string().default('UTC'),
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

const notificationFilterSchema = paginationSchema.extend({
  is_read: z.boolean().optional(),
  type: z.string().optional(),
});

const auditLogFilterSchema = paginationSchema.extend({
  action: z.string().optional(),
  success: z.boolean().optional(),
  user_id: z.string().uuid().optional(),
});

const adminUserFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
});

const adminSubscriptionFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  user_id: z.string().uuid().optional(),
});

interface UserPreferencesRow {
  id: string;
  user_id: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

// --- User Router ---
export const userRouter = router({
  /**
   * Get the current user's full profile (users + user_preferences)
   */
  getFullProfile: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, created_at, updated_at")
      .eq("id", userId)
      .single();
    if (userError) throw new Error(userError.message);
    
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .single();
    if (prefError && prefError.code !== 'PGRST116') { // Not found is ok
      throw new Error(prefError.message);
    }
    
    // Initialize preferences if they don't exist
    if (!preferences) {
      const defaultPreferences = {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system',
      };
      const { error: insertError } = await supabase
        .from("user_preferences")
        .insert([{ user_id: userId, preferences: defaultPreferences }]);
      if (insertError) throw new Error(insertError.message);
      return { ...user, preferences: defaultPreferences };
    }
    
    return { ...user, preferences: preferences.preferences };
  }),

  /**
   * Update user profile (email only)
   */
  updateProfile: protectedProcedure.input(z.object({
    email: z.string().email().optional(),
  })).mutation(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { error } = await supabase
      .from("users")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    
    // First try to get existing preferences
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching preferences:', fetchError);
      throw new Error(fetchError.message);
    }

    // Return default preferences if none exist
    if (!existingPrefs) {
      const defaultPreferences: UserPreferences = {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
        theme: 'system',
      };
      
      const { error: insertError } = await supabase
        .from("user_preferences")
        .insert([{ user_id: userId, preferences: defaultPreferences }]);
      
      if (insertError) {
        console.error('Error inserting preferences:', insertError);
        throw new Error(insertError.message);
      }
      
      return defaultPreferences;
    }

    return existingPrefs.preferences as UserPreferences;
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(preferencesSchema.partial())
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx;
      
      // Get current preferences
      const { data: current, error: fetchError } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message);
      }

      const updatedPreferences = {
        ...(current?.preferences || {
          militaryTime: false,
          workType: 'full-time',
          categories: [],
          theme: 'system',
        }),
        ...input,
      };

      // Update preferences using upsert with the correct structure
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ 
          user_id: userId, 
          preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw new Error(error.message);
      return updatedPreferences;
    }),

  /**
   * Work Schedules CRUD
   */
  getWorkSchedules: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("user_id", userId)
      .order("day");
    
    if (error) {
      console.error('Error fetching work schedules:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  }),

  addWorkSchedule: protectedProcedure
    .input(workScheduleSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx;
      const { error } = await supabase
        .from("work_schedules")
        .insert([{ ...input, user_id: userId }]);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  updateWorkSchedule: protectedProcedure
    .input(workScheduleSchema.extend({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx;
      const { id, ...updates } = input;
      const { error } = await supabase
        .from("work_schedules")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  deleteWorkSchedule: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx;
      const { error } = await supabase
        .from("work_schedules")
        .delete()
        .eq("id", input.id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  /**
   * Notification Preferences (from user_preferences.preferences.notifications)
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data?.preferences?.notifications;
  }),
  updateNotificationPreferences: protectedProcedure.input(z.record(z.any())).mutation(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    // Fetch current preferences
    const { data, error: fetchError } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    const newPreferences = { ...data.preferences, notifications: input };
    const { error } = await supabase
      .from("user_preferences")
      .update({ preferences: newPreferences })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * List notifications with pagination and filtering
   */
  getNotifications: protectedProcedure.input(notificationFilterSchema.optional()).query(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { page = 1, pageSize = 20, is_read, type } = input || {};
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId);
    if (typeof is_read === "boolean") query = query.eq("is_read", is_read);
    if (type) query = query.eq("type", type);
    query = query.order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
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
   * Get subscription and plan info
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, userId } = ctx;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("*, plan_tiers(*)")
      .eq("user_id", userId)
      .single();
    if (subError) throw new Error(subError.message);
    return sub;
  }),

  /**
   * Get audit logs with pagination and filtering
   */
  getAuditLogs: protectedProcedure.input(auditLogFilterSchema.optional()).query(async ({ ctx, input }) => {
    const { supabase, userId } = ctx;
    const { page = 1, pageSize = 20, action, success } = input || {};
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (typeof success === "boolean") query = query.eq("success", success);
    query = query.order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
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
   * Admin: List users with pagination and filtering
   */
  adminListUsers: protectedProcedure.input(adminUserFilterSchema.optional()).query(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { page = 1, pageSize = 20, search } = input || {};
    let query = supabase
      .from("users")
      .select("id, email, created_at", { count: "exact" });
    if (search) query = query.ilike("email", `%${search}%`);
    query = query.order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
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
   * Admin: Get a user's profile by id
   */
  adminGetUserProfile: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { data, error } = await supabase
      .from("users")
      .select("id, email, created_at, updated_at")
      .eq("id", input.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }),

  /**
   * Admin: Delete a user by id (cascades to related tables)
   */
  adminDeleteUser: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  /**
   * Admin: List audit logs for any user, with pagination/filtering
   */
  adminListAuditLogs: protectedProcedure.input(auditLogFilterSchema.optional()).query(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { page = 1, pageSize = 20, action, success, user_id } = input || {};
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" });
    if (user_id) query = query.eq("user_id", user_id);
    if (action) query = query.eq("action", action);
    if (typeof success === "boolean") query = query.eq("success", success);
    query = query.order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
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
   * Admin: List all subscriptions, with pagination/filtering
   */
  adminListSubscriptions: protectedProcedure.input(adminSubscriptionFilterSchema.optional()).query(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { page = 1, pageSize = 20, status, user_id } = input || {};
    let query = supabase
      .from("subscriptions")
      .select("*, plan_tiers(*)", { count: "exact" });
    if (status) query = query.eq("status", status);
    if (user_id) query = query.eq("user_id", user_id);
    query = query.order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    const { data, error, count } = await query;
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
   * Admin: Update a user's email by id
   */
  adminUpdateUser: protectedProcedure.input(z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
  })).mutation(async ({ ctx, input }) => {
    if (!ctx.isAdmin) throw new Error("FORBIDDEN");
    const { supabase } = ctx;
    const { id, ...update } = input;
    const { error } = await supabase
      .from("users")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  }),

  // TODO: Add more advanced admin features (e.g., impersonation, force password reset)
});

export default userRouter; 