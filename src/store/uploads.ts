import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-store";
import axios from "axios";
import { useShallow } from "zustand/shallow";
import { compressImage } from "../utils/compress-image";

export interface Upload {
  id: string;
  name: string;
  file: File;
  abortController?: AbortController;
  status: "progress" | "success" | "error" | "canceled";
  originalSizeInBytes: number;
  compressedSizeInBytes?: number;
  uploadSizeInBytes: number;
  remoteUrl?: string;
}

interface State {
  uploads: Map<string, Upload>;
}

interface Actions {
  addUploads: (files: File[]) => void;
  processUpload: (uploadId: string) => Promise<void>;
  cancelUpload: (uploadId: string) => void;
  updateUpload: (uploadId: string, data: Partial<Upload>) => void;
  retryUpload: (uploadId: string) => void;
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

          state.uploads.set(id, {
            id,
            name: file.name,
            file,
            status: "progress",
            originalSizeInBytes: file.size,
            uploadSizeInBytes: 0,
          });
        }
      });

      const { processUpload } = get();

      for (const id of ids) {
        processUpload(id);
      }
    },
    async processUpload(uploadId) {
      try {
        const upload = get().uploads.get(uploadId);
        if (!upload) return;

        const abortController = new AbortController();

        get().updateUpload(uploadId, {
          abortController,
          status: "progress",
          compressedSizeInBytes: undefined,
          uploadSizeInBytes: 0,
          remoteUrl: undefined,
        });

        const compressedFile = await compressImage({
          file: upload.file,
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.8,
        });

        get().updateUpload(uploadId, {
          compressedSizeInBytes: compressedFile.size,
        });

        const { url } = await uploadFileToStorage(
          {
            file: compressedFile,
            onProgress(sizeInBytes) {
              get().updateUpload(uploadId, {
                uploadSizeInBytes: sizeInBytes,
              });
            },
          },
          { signal: abortController.signal }
        );

        get().updateUpload(uploadId, {
          status: "success",
          remoteUrl: url,
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          get().updateUpload(uploadId, {
            status: "canceled",
          });

          return;
        }

        get().updateUpload(uploadId, {
          status: "error",
        });
      }
    },
    cancelUpload(uploadId) {
      const upload = get().uploads.get(uploadId);
      if (!upload) return;

      upload.abortController?.abort();
    },
    updateUpload(uploadId, data) {
      const upload = get().uploads.get(uploadId);

      if (!upload) return;

      set((state) => {
        state.uploads.set(uploadId, { ...upload, ...data });
      });
    },
    retryUpload(uploadId) {
      get().processUpload(uploadId);
    },
  }))
);

export const usePendingUploads = () => {
  return useUploads(
    useShallow((store) => {
      const isThereAnyPendingUploads = Array.from(store.uploads.values()).some(
        (upload) => upload.status === "progress"
      );

      if (isThereAnyPendingUploads === false) {
        return { isThereAnyPendingUploads, globalPercentage: 100 };
      }

      const { total, uploaded } = Array.from(store.uploads.values()).reduce(
        (acc, upload) => {
          if (upload.compressedSizeInBytes) {
            acc.uploaded = acc.uploaded + upload.uploadSizeInBytes;
          }

          acc.total +=
            upload.compressedSizeInBytes || upload.originalSizeInBytes;

          return acc;
        },
        {
          total: 0,
          uploaded: 0,
        }
      );

      const globalPercentage = Math.min(
        Math.round((uploaded / total) * 100),
        100
      );

      return {
        isThereAnyPendingUploads,
        globalPercentage,
      };
    })
  );
};
