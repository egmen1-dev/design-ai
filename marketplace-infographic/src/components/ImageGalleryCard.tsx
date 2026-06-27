import { DownloadButton } from "@/components/DownloadButton";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { MarketplacePreview } from "@/components/MarketplacePreview";
import { generatedImageSrc } from "@/lib/image-url";
import type { UserFeedbackValue } from "@/lib/feedback/types";

export function ImageGalleryCard({
  id,
  prompt,
  imagePath,
  showPreview = false,
  userFeedback = null,
}: {
  id: string;
  prompt: string;
  imagePath: string;
  showPreview?: boolean;
  userFeedback?: UserFeedbackValue | null;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      {showPreview ? (
        <div className="p-4">
          <MarketplacePreview imagePath={imagePath} />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={generatedImageSrc(imagePath)}
          alt={prompt.slice(0, 80)}
          className="w-full object-cover"
        />
      )}
      <div className="flex items-center justify-between gap-2 p-4">
        <p className="line-clamp-2 flex-1 text-sm text-slate-400">{prompt}</p>
        <div className="flex shrink-0 items-center gap-2">
          <FeedbackButtons imageId={id} initialFeedback={userFeedback} compact />
          <DownloadButton imageId={id} filename={`infographic-${id.slice(0, 8)}.png`} />
        </div>
      </div>
    </article>
  );
}
