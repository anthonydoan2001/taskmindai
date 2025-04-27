import { router } from "../trpc-helpers";
import userRouter from "./user";
import scheduleRouter from "./schedule";

export const appRouter = router({
  user: userRouter,
  schedule: scheduleRouter,
});

export type AppRouter = typeof appRouter; 