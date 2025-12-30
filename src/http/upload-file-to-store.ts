import axios from "axios";

interface UploadFileToStorageParams {
  file: File;
}

interface UploadFileToStorageOpts {
  signal?: AbortSignal;
}

export const uploadFileToStorage = async (
  { file }: UploadFileToStorageParams,
  opts?: UploadFileToStorageOpts
) => {
  const data = new FormData();

  data.append("file", file);

  const response = await axios.post("http://localhost:3333/uploads", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    signal: opts?.signal,
  });

  return { url: response.data.url };
};
