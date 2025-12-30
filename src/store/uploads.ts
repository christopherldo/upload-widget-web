import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-store";

export interface Upload {
  name: string;
  file: File;
}

interface State {
  uploads: Map<string, Upload>;
}

interface Actions {
  addUploads: (files: File[]) => void;
  processUpload: (uploadId: string) => Promise<void>;
}

enableMapSet();

export const useUploads = create<State & Actions>()(
  immer((set, get) => ({
    uploads: new Map(),
    addUploads: (files) => {
      const ids: string[] = [];

      set((state) => {
        for (const file of files) {
          const id = crypto.randomUUID();
          ids.push(id);
          state.uploads.set(id, { name: file.name, file });
        }
      });

      const { processUpload } = get();

      for (const id of ids) {
        processUpload(id);
      }
    },
    async processUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);

      if (!upload) return;

      await uploadFileToStorage({ file: upload.file });
    },
  }))
);
