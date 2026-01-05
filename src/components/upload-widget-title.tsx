import { UploadCloud } from "lucide-react";
import { usePendingUploads } from "../store/uploads";

export const UploadWidgetTitle = () => {
  const { isThereAnyPendingUploads, globalPercentage } = usePendingUploads();

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <UploadCloud className="size-4 tet-zinc-400" strokeWidth={1.5} />
      {isThereAnyPendingUploads ? (
        <span className="flex items-baseline gap-1">
          Uploading
          <span className="text-xs text-zing-400 tabular-nums">
            {globalPercentage}%
          </span>
        </span>
      ) : (
        <span className="min-w-20">Upload files</span>
      )}
    </div>
  );
};
