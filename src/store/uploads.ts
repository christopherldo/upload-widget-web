import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";

export interface Upload {
  name: string;
  file: File;
}

interface State {
  uploads: Map<string, Upload>;
}

interface Actions {
  addUploads: (files: File[]) => void;
}

enableMapSet();

export const useUploads = create<State & Actions>()(
  immer((set) => ({
    uploads: new Map(),
    addUploads: (files) => {
      set((state) => {
        for (const file of files) {
          const id = crypto.randomUUID();
          state.uploads.set(id, { name: file.name, file });
        }
      });
    },
  }))
);
