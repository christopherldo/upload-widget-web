import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-store";
import axios from "axios";

export interface Upload {
  id: string;
  name: string;
  file: File;
  abortController: AbortController;
  status: "progress" | "success" | "error" | "canceled";
}

interface State {
  uploads: Map<string, Upload>;
}

interface Actions {
  addUploads: (files: File[]) => void;
  processUpload: (uploadId: string) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
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

          const abortController = new AbortController();

          state.uploads.set(id, {
            id,
            name: file.name,
            file,
            abortController,
            status: "progress",
          });
        }
      });

      const { processUpload } = get();

      for (const id of ids) {
        processUpload(id);
      }
    },
    async processUpload(uploadId: string) {
      try {
        const upload = get().uploads.get(uploadId);
        if (!upload) return;

        await uploadFileToStorage(
          { file: upload.file },
          { signal: upload.abortController.signal }
        );

        set((state) => {
          const current = state.uploads.get(uploadId);
          if (!current || current.status === "canceled") return;

          current.status = "success";
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          set((state) => {
            const current = state.uploads.get(uploadId);
            if (!current) return;

            current.status = "canceled";
          });

          return;
        }

        set((state) => {
          const current = state.uploads.get(uploadId);
          if (!current || current.status === "canceled") return;

          current.status = "error";
        });
      }
    },
    cancelUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);
      if (!upload) return;

      upload.abortController.abort();
    },
  }))
);
