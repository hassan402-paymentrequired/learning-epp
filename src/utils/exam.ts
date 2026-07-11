export function isJambExamSlug(slug: string | null | undefined): boolean {
  return slug?.toLowerCase() === 'jamb';
}

/** Resolves the exam_type param accepted by the API (UUID preferred, slug fallback). */
export function resolveExamCategoryParam(selection: {
  examCategoryUuid?: string | null;
  examTypeSlug?: string | null;
}): string {
  return selection.examCategoryUuid || selection.examTypeSlug || '';
}

type MaterialIconName = 'school' | 'menu-book' | 'account-balance';

const SLUG_MATERIAL_ICONS: Record<string, MaterialIconName> = {
  jamb: 'school',
  'unilag-dli': 'menu-book',
  'unilag-post-utme': 'school',
};

export function getExamCategoryMaterialIcon(
  category: { slug: string; flow_type: 'standard' | 'departmental' }
): MaterialIconName {
  const slugIcon = SLUG_MATERIAL_ICONS[category.slug.toLowerCase()];
  if (slugIcon) {
    return slugIcon;
  }

  return category.flow_type === 'departmental' ? 'menu-book' : 'school';
}
