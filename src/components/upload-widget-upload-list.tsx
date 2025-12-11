import { UploadWidgetUploadItem } from "./upload-widget-upload-item";

export const UploadWidgetUploadList = () => {
  const isUploadListEmpty = false;

  return (
    <div className="px-3 flex flex-col gap-3">
      <span className="text-xs font-medium">
        Uploaded files <span className="text-zinc-400">(2)</span>
      </span>

      {isUploadListEmpty ? (
        <span className="text-xs text-zinc-400">No uploads addded</span>
      ) : (
        <div className="flex flex-col gap-2">
          <UploadWidgetUploadItem />
          <UploadWidgetUploadItem />
        </div>
      )}
    </div>
  );
};
