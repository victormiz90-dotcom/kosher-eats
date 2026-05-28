import type { DeliveryLink, DeliveryPlatform } from '@/types/database';

// ============================================================================
// Deep link builder
// ============================================================================
// Takes a stored delivery_link row and returns the final URL to send the user
// to, with affiliate tracking parameters appended where applicable.
//
// IMPORTANT: Uber Eats / DoorDash / Grubhub affiliate programs all use Impact
// or CJ Affiliate. You'll get a publisher ID after approval and plug it in via
// env vars. Until then, links work fine, you just won't earn the CPA.
// ============================================================================

interface PlatformConfig {
  label: string;
  affiliateParamKey?: string;
  affiliateEnvVar?: string;
  iosUniversalLink?: boolean; // can open native app via universal link
}

const PLATFORM_CONFIG: Record<DeliveryPlatform, PlatformConfig> = {
  ubereats: {
    label: 'Uber Eats',
    affiliateParamKey: 'irgwc',
    affiliateEnvVar: 'UBEREATS_IMPACT_PARTNER_ID',
    iosUniversalLink: true
  },
  doordash: {
    label: 'DoorDash',
    affiliateParamKey: 'irclickid',
    affiliateEnvVar: 'DOORDASH_IMPACT_PARTNER_ID',
    iosUniversalLink: true
  },
  grubhub: {
    label: 'Grubhub',
    affiliateParamKey: 'affiliate',
    affiliateEnvVar: 'GRUBHUB_CJ_AFFILIATE_ID',
    iosUniversalLink: true
  },
  seamless: {
    label: 'Seamless',
    affiliateParamKey: 'affiliate',
    affiliateEnvVar: 'GRUBHUB_CJ_AFFILIATE_ID', // Seamless = Grubhub
    iosUniversalLink: true
  },
  caviar: {
    label: 'Caviar',
    iosUniversalLink: true
  },
  direct: {
    label: 'Order Direct'
  },
  other: {
    label: 'Order'
  }
};

export function buildDeepLink(link: DeliveryLink, clickId?: string): string {
  const config = PLATFORM_CONFIG[link.platform];
  if (!config) return link.url;

  try {
    const url = new URL(link.url);

    // Append affiliate tracking if configured
    if (config.affiliateParamKey && config.affiliateEnvVar) {
      const partnerId = process.env[config.affiliateEnvVar];
      if (partnerId) {
        url.searchParams.set(config.affiliateParamKey, partnerId);
      }
    }

    // Append our own click ID for attribution analysis
    if (clickId) {
      url.searchParams.set('ke_click_id', clickId);
    }

    return url.toString();
  } catch {
    return link.url;
  }
}

export function getPlatformLabel(platform: DeliveryPlatform): string {
  return PLATFORM_CONFIG[platform]?.label ?? 'Order';
}
