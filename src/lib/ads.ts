import { adsConfig } from "@/config/ads";

/**
 * Automatically inserts an in-article advertisement slot with strict "ADVERTISEMENT" labeling
 * after paragraph 3 of the article body, fully configurable via src/config/ads.ts.
 */
export function injectInArticleAds(html: string): string {
  if (!html) return "";

  // If globally disabled or in-article ad is disabled, don't alter the HTML
  if (!adsConfig.enabled || !adsConfig.slots.inArticle.enabled || adsConfig.slots.inArticle.type === "none") {
    return html;
  }

  // Split by closing paragraph tag
  const paragraphs = html.split("</p>");

  // If article is very short (less than 3 paragraphs), do not disrupt reading
  if (paragraphs.length < 4) {
    return html;
  }

  const slotConfig = adsConfig.slots.inArticle;
  const isAdSense = slotConfig.type === "adsense" && Boolean(adsConfig.adsenseClientId);

  let adMarkup = "";

  if (isAdSense) {
    adMarkup = `
<div class="my-10 clear-both text-center select-none" id="in-article-ad">
  <span class="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9ca3af] block text-center mb-2 font-sans">
    ADVERTISEMENT
  </span>
  <div class="min-h-[100px] overflow-hidden rounded-xl bg-[#fafafa] border border-[#eaedeb] flex items-center justify-center p-2">
    <ins class="adsbygoogle"
         style="display:block; text-align:center; min-height:90px; width:100%;"
         data-ad-layout="in-article"
         data-ad-format="fluid"
         data-ad-client="${adsConfig.adsenseClientId}"
         data-ad-slot="${slotConfig.adSlot || ''}"></ins>
  </div>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
`;
  } else if (slotConfig.custom) {
    const custom = slotConfig.custom;
    adMarkup = `
<div class="my-10 p-5 sm:p-6 rounded-2xl bg-[#f4fbf7] border border-[#d6e8de] text-center clear-both select-none" id="in-article-ad">
  <span class="text-[10px] font-bold uppercase tracking-widest text-[#079653] block mb-1.5 font-sans">
    ${custom.badge || "SPONSORED"}
  </span>
  <h4 class="font-bold text-[16px] sm:text-[17px] text-[#101313] font-sans m-0 leading-snug">
    ${custom.title}
  </h4>
  <p class="text-[13px] text-[#4b5563] mt-1.5 max-w-lg mx-auto font-sans leading-relaxed">
    ${custom.description}
  </p>
  <div class="mt-3.5">
    <a href="${custom.ctaUrl}" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#079653] text-white text-xs font-semibold hover:bg-[#057842] transition font-sans shadow-xs">
      <span>${custom.ctaText}</span>
      <span>&rarr;</span>
    </a>
  </div>
</div>
`;
  }

  if (!adMarkup) {
    return html;
  }

  // Insert after the 3rd paragraph
  const targetIndex = 3;
  paragraphs[targetIndex - 1] = paragraphs[targetIndex - 1] + "</p>" + adMarkup;

  return paragraphs.slice(0, targetIndex).join("") + paragraphs.slice(targetIndex).join("</p>");
}
