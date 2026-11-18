export interface OrganizationSocialLinks {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

export function parseOrgAddressAndSocial(rawAddress: string | null): {
  address: string | null;
  socialLinks: OrganizationSocialLinks;
} {
  if (!rawAddress) {
    return { address: null, socialLinks: {} };
  }

  const trimmed = rawAddress.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        address:
          typeof parsed.text === 'string'
            ? parsed.text
            : typeof parsed.address === 'string'
              ? parsed.address
              : null,
        socialLinks:
          parsed.socialLinks && typeof parsed.socialLinks === 'object'
            ? parsed.socialLinks
            : {},
      };
    } catch {
      return { address: rawAddress, socialLinks: {} };
    }
  }

  return { address: rawAddress, socialLinks: {} };
}

export function sanitizeSocialUrl(
  platform: keyof OrganizationSocialLinks,
  val?: string | null,
): string | undefined {
  if (!val) return undefined;
  let clean = val.trim();
  if (!clean) return undefined;

  if (platform === 'instagram') {
    if (clean.startsWith('@')) {
      clean = `https://instagram.com/${clean.substring(1)}`;
    } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = clean.includes('instagram.com') ? `https://${clean}` : `https://instagram.com/${clean}`;
    }
  } else if (platform === 'tiktok') {
    if (clean.startsWith('@')) {
      clean = `https://tiktok.com/${clean}`;
    } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = clean.includes('tiktok.com') ? `https://${clean}` : `https://tiktok.com/@${clean}`;
    }
  } else if (platform === 'facebook') {
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = clean.includes('facebook.com') ? `https://${clean}` : `https://facebook.com/${clean}`;
    }
  } else if (platform === 'youtube') {
    if (clean.startsWith('@')) {
      clean = `https://youtube.com/${clean}`;
    } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = clean.includes('youtube.com') ? `https://${clean}` : `https://youtube.com/@${clean}`;
    }
  } else if (platform === 'whatsapp') {
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (clean.includes('chat.whatsapp.com')) {
        clean = `https://${clean}`;
      } else {
        const digits = clean.replace(/[^0-9]/g, '');
        if (digits) {
          clean = `https://wa.me/${digits}`;
        }
      }
    }
  }

  return clean;
}

export function serializeOrgAddressAndSocial(
  addressText?: string | null,
  socialLinks?: OrganizationSocialLinks | null,
): string | null {
  const cleanAddress = addressText?.trim() || null;
  const cleanSocial: OrganizationSocialLinks = {};

  if (socialLinks) {
    if (socialLinks.whatsapp) {
      const sanitized = sanitizeSocialUrl('whatsapp', socialLinks.whatsapp);
      if (sanitized) cleanSocial.whatsapp = sanitized;
    }
    if (socialLinks.instagram) {
      const sanitized = sanitizeSocialUrl('instagram', socialLinks.instagram);
      if (sanitized) cleanSocial.instagram = sanitized;
    }
    if (socialLinks.facebook) {
      const sanitized = sanitizeSocialUrl('facebook', socialLinks.facebook);
      if (sanitized) cleanSocial.facebook = sanitized;
    }
    if (socialLinks.youtube) {
      const sanitized = sanitizeSocialUrl('youtube', socialLinks.youtube);
      if (sanitized) cleanSocial.youtube = sanitized;
    }
    if (socialLinks.tiktok) {
      const sanitized = sanitizeSocialUrl('tiktok', socialLinks.tiktok);
      if (sanitized) cleanSocial.tiktok = sanitized;
    }
  }

  const hasAnySocial = Object.keys(cleanSocial).length > 0;

  if (!hasAnySocial) {
    return cleanAddress;
  }

  return JSON.stringify({
    text: cleanAddress,
    socialLinks: cleanSocial,
  });
}
