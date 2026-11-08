export interface FormattedAmenity {
  id: string;
  label: string;
  iconName: 'wifi' | 'laundry' | 'kitchen' | 'gym' | 'parking' | 'workspace' | 'ac' | 'pet' | 'default';
}

const AMENITY_MAP: Record<string, { label: string; iconName: FormattedAmenity['iconName'] }> = {
  wifi: { label: 'High-speed WiFi', iconName: 'wifi' },
  laundry: { label: 'In-unit Laundry', iconName: 'laundry' },
  kitchen: { label: 'Gourmet Kitchen', iconName: 'kitchen' },
  balcony: { label: 'Private Balcony', iconName: 'default' },
  gym: { label: 'Building Gym', iconName: 'gym' },
  workspace: { label: 'Work Station', iconName: 'workspace' },
  parking: { label: 'Vehicle Parking', iconName: 'parking' },
  ac: { label: 'Air Conditioning', iconName: 'ac' },
  pet_friendly: { label: 'Pet Friendly', iconName: 'pet' },
};

export function deduplicateAmenities(rawAmenities?: string[]): FormattedAmenity[] {
  if (!rawAmenities || rawAmenities.length === 0) return [];

  const seenCanonical = new Set<string>();
  const result: FormattedAmenity[] = [];

  for (const raw of rawAmenities) {
    if (!raw || typeof raw !== 'string') continue;
    const clean = raw.toLowerCase().trim().replace(/[\s-]+/g, '_');

    // Canonicalize variants to prevent any duplicate like 'wifi' and 'highspeed_wifi'
    let canonicalKey = clean;
    if (clean.includes('wifi')) {
      canonicalKey = 'wifi';
    } else if (clean.includes('laundr') || clean.includes('wash')) {
      canonicalKey = 'laundry';
    } else if (clean.includes('kitchen') || clean.includes('cook')) {
      canonicalKey = 'kitchen';
    } else if (clean.includes('gym') || clean.includes('fit')) {
      canonicalKey = 'gym';
    } else if (clean.includes('work') || clean.includes('desk')) {
      canonicalKey = 'workspace';
    } else if (clean.includes('park')) {
      canonicalKey = 'parking';
    } else if (clean.includes('ac') || clean.includes('air_cond') || clean.includes('condition')) {
      canonicalKey = 'ac';
    } else if (clean.includes('pet') || clean.includes('dog') || clean.includes('cat')) {
      canonicalKey = 'pet_friendly';
    } else if (clean.includes('balcon') || clean.includes('terrace')) {
      canonicalKey = 'balcony';
    }

    if (seenCanonical.has(canonicalKey)) {
      continue;
    }
    seenCanonical.add(canonicalKey);

    const mapping = AMENITY_MAP[canonicalKey];
    if (mapping) {
      result.push({
        id: canonicalKey,
        label: mapping.label,
        iconName: mapping.iconName,
      });
    } else {
      result.push({
        id: canonicalKey,
        label: raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        iconName: 'default',
      });
    }
  }

  return result;
}
