import { MagneticTagCloud } from "@/components/MagneticTagCloud";
import { filterTagCloudItems } from "@/lib/tag-cloud-weights";
import type { TagCloudItem } from "@/lib/tags";

type TagCloudSectionProps = {
  items: TagCloudItem[];
  activeTag?: string | null;
};

export function TagCloudSection({ items, activeTag }: TagCloudSectionProps) {
  if (items.length === 0) return null;

  const cloudItems = filterTagCloudItems(items);
  if (cloudItems.length === 0) return null;

  return (
    <section
      aria-label="按标签浏览"
      className="tag-cloud-section editorial-reveal mt-14 w-full sm:mt-16"
    >
      <div className="max-w-2xl">
        <p className="section-kicker">主题词云</p>
        <h2 className="font-display mt-3 text-[1.55rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
          按兴趣慢慢找
        </h2>
      </div>

      <div className="tag-cloud-panel editorial-card mt-6 overflow-hidden rounded-[1.6rem] p-4 sm:p-6">
        <MagneticTagCloud items={cloudItems} activeTag={activeTag} />
      </div>
    </section>
  );
}
