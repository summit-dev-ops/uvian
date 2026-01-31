import type { QueryClient } from "@tanstack/react-query";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { StoreApi } from "zustand";
import type { AppState } from "~/lib/stores";

export type BaseActionContext = {
  queryClient: QueryClient;
  store: StoreApi<AppState>;
  router: AppRouterInstance;
};

export type BaseAction<P, O> = {
  id: string;
  canPerform: (ctx: BaseActionContext, payload: P) => boolean;
  perform: (ctx: BaseActionContext, payload: P) => O;
  group: string;
  variant: "destructive" | "info";
};
