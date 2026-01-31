import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { AppState } from "./types";



export const createAppStore = () => {
  return createStore<AppState>()(
    immer((set, get, api) => ({
    }))
  );
};
