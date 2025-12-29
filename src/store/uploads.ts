import { create } from "zustand";

export interface Upload {
  name: string;
  file: File;
}

interface UploadState {
  uploads: Map<string, Upload>;
  addUploads: (files: File[]) => void;
}

export const useUploads = create<UploadState>((set, get) => {
  const addUploads = (files: File[]) => {
    set((state) => {
      const nextUploads = new Map(state.uploads);

      for (const file of files) {
        const uploadId = crypto.randomUUID();

        nextUploads.set(uploadId, {
          name: file.name,
          file,
        });
      }

      return {
        uploads: nextUploads,
      };
    });
  };

  return {
    uploads: new Map(),
    addUploads,
  };
});
