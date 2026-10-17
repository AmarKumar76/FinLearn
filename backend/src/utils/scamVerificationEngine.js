import dns from 'node:dns/promises';
import { VERIFIED_BANK_DOMAINS, SCAM_INDICATOR_PATTERNS } from '../config/threatRegistry.js';
import { Source } from '../models/source.model.js';

// Reserved and private IPv4 / IPv6 blocks for SSRF protection
const PRIVATE_IP_PATTERNS = [
  /^127\./,                         // IPv4 Loopback
  /^10\./,                          // RFC1918 Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC1918 Class B
  /^192\.168\./,                    // RFC1918 Class C
  /^169\.254\./,                    // Link-local
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT RFC6598
  /^0\./,                           // Current network
  /^::1$/,                          // IPv6 loopback
  /^::$/,                           // IPv6 unspecified
  /^::ffff:127\./i,                 // IPv4-mapped IPv6 loopback
  /^::ffff:10\./i,                  // IPv4-mapped IPv6 Class A
  /^::ffff:192\.168\./i,            // IPv4-mapped IPv6 Class C
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i, // IPv4-mapped IPv6 Class B
  /^::ffff:169\.254\./i,            // IPv4-mapped IPv6 link-local
  /^fc00:/i,                        // IPv6 unique local (fc00::/7)
  /^fd[0-9a-f]{2}:/i,               // IPv6 unique local
  /^fe80:/i,                        // IPv6 link-local (fe80::/10)
  /^fec0:/i,                        // IPv6 site-local (deprecated)
];

/**
 * Checks whether an IP address belongs to private or internal address spaces.
 */
export function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.trim().toLowerCase();
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1' || clean === '0.0.0.0') {
    return true;
  }
  return PRIVATE_IP_PATTERNS.some((pat) => pat.test(clean));
}

/**
 * Safely parses, validates, and normalizes a candidate URL string.
 * Enforces http/https protocols only and extracts the normalized hostname.
 */
export function safelyParseUrl(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;

  let cleaned = candidate.trim();
  // Strip leading/trailing quotation marks or common surrounding characters
  cleaned = cleaned.replace(/^["'<(\[]+|[>"')\]]+$/g, '');

  if (!cleaned) return null;

  // If candidate already specifies a protocol (e.g. ftp://, javascript:, file:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(cleaned) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(cleaned)) {
    if (!/^https?:\/\//i.test(cleaned)) {
      const proto = cleaned.split(':')[0];
      return {
        isValid: false,
        error: `Unsafe or unsupported protocol: ${proto}:. Only HTTP and HTTPS are permitted.`,
      };
    }
  } else {
    // Add default protocol if omitted
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);

    // Enforce safe protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: `Unsafe or unsupported protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost or direct IP-based hosts in URL
    const isDirectIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
    if (hostname === 'localhost' || isPrivateIp(hostname)) {
      return {
        isValid: false,
        isPrivate: true,
        error: 'URL resolves directly to a private, loopback, or non-routable address space.',
      };
    }

    return {
      isValid: true,
      originalUrl: candidate,
      normalizedUrl: parsed.href,
      protocol: parsed.protocol,
      hostname,
      pathname: parsed.pathname,
      search: parsed.search,
      isDirectIp,
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'Malformed URL format could not be parsed safely.',
    };
  }
}

/**
 * Verifies hostname against the official verified domain registry.
 * Detects lookalikes, unauthorized subdomains, and mismatched TLDs.
 */
export function inspectDomainAgainstRegistry(hostname, claimedOrg = null) {
  if (!hostname) {
    return {
      isVerifiedOfficial: false,
      status: 'no_domain_provided',
      details: 'No URL or domain was provided for inspection.',
    };
  }

  const cleanHost = hostname.toLowerCase().replace(/^\.+|\.+$/g, '');

  // 1. Direct match with verified bank and regulator domains
  for (const entry of VERIFIED_BANK_DOMAINS) {
    const allOfficial = [entry.officialDomain, ...(entry.alternateDomains || [])];
    for (const offDomain of allOfficial) {
      if (cleanHost === offDomain || cleanHost.endsWith(`.${offDomain}`)) {
        return {
          isVerifiedOfficial: true,
          status: 'verified_official_domain',
          hostname: cleanHost,
          matchedEntity: entry.name,
          entityType: entry.entityType,
          officialDomain: entry.officialDomain,
          helpline: entry.helpline,
          phishingWarningUrl: entry.phishingWarningUrl,
          details: `The domain "${cleanHost}" matches the registered official digital property for ${entry.name}.`,
        };
      }
    }
  }

  // 2. Lookalike / typosquatting check against known entities
  // E.g. "sbi-kyc-update.com", "hdfc-bank-verification.net", "rbi-reward.online"
  for (const entry of VERIFIED_BANK_DOMAINS) {
    const searchTerms = [entry.name.toLowerCase(), ...(entry.aliases || [])];
    for (const term of searchTerms) {
      if (term.length < 3) continue; // Skip very short abbreviations to prevent false positives

      // Check if term is present in hostname but host is NOT in official domains
      const containsAlias = cleanHost.includes(term.replace(/\s+/g, '')) || cleanHost.includes(term.replace(/\s+/g, '-'));
      if (containsAlias) {
        return {
          isVerifiedOfficial: false,
          isLookalikeDeception: true,
          status: 'suspicious_lookalike_domain',
          hostname: cleanHost,
          mimickedEntity: entry.name,
          officialDomain: entry.officialDomain,
          helpline: entry.helpline,
          details: `CRITICAL RED FLAG: The domain "${cleanHost}" contains the name or abbreviation of "${entry.name}", but it is NOT the official domain (${entry.officialDomain}). This is a classic bank impersonation / phishing technique.`,
        };
      }
    }
  }

  // 3. Claimed bank check when user specified a claimed organization
  if (claimedOrg && typeof claimedOrg === 'string' && claimedOrg.trim().length > 2) {
    const claimedLower = claimedOrg.trim().toLowerCase();
    for (const entry of VERIFIED_BANK_DOMAINS) {
      const matchClaim = [entry.name.toLowerCase(), ...(entry.aliases || [])].some(
        (alias) => claimedLower.includes(alias) || alias.includes(claimedLower)
      );
      if (matchClaim) {
        // User claims it's from this bank, but domain does NOT match
        return {
          isVerifiedOfficial: false,
          isMismatchedDomain: true,
          status: 'claimed_entity_domain_mismatch',
          hostname: cleanHost,
          claimedEntity: entry.name,
          officialDomain: entry.officialDomain,
          details: `The message claims to be from "${entry.name}", but the submitted link points to "${cleanHost}" instead of the authentic bank domain (${entry.officialDomain}).`,
        };
      }
    }
  }

  // 4. General heuristic flags (e.g. suspicious TLDs often abused in fast-flux phishing, or raw IP)
  const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.buzz', '.work', '.click'];
  const hasSuspiciousTld = suspiciousTlds.some((tld) => cleanHost.endsWith(tld));

  return {
    isVerifiedOfficial: false,
    status: 'unverified_third_party_domain',
    hostname: cleanHost,
    hasSuspiciousTld,
    details: hasSuspiciousTld
      ? `The domain "${cleanHost}" uses a high-risk top-level domain frequently associated with temporary scam landing pages.`
      : `The domain "${cleanHost}" is not listed in FinLearn's verified Indian banking and regulatory registry.`,
  };
}

/**
 * Secure Server-Side Network DNS / IP Resolution with SSRF and Private Range Protection.
 * Only inspects DNS without making arbitrary HTTP requests to remote servers.
 */
export async function performSafeDnsCheck(hostname) {
  if (!hostname) return { checked: false, reason: 'No hostname provided' };

  try {
    const addresses = await dns.resolve4(hostname);
    if (!addresses || addresses.length === 0) {
      return {
        checked: true,
        resolved: false,
        details: 'Hostname did not resolve to any public IPv4 addresses.',
      };
    }

    const hasPrivate = addresses.some((ip) => isPrivateIp(ip));
    if (hasPrivate) {
      return {
        checked: true,
        resolved: true,
        isPrivateAddressBlocked: true,
        details: 'DNS resolution revealed private or internal network addresses. Access blocked for SSRF protection.',
      };
    }

    return {
      checked: true,
      resolved: true,
      addresses: addresses.slice(0, 3), // Return up to 3 resolved IPs
      details: `Host resolved to legitimate public address space (${addresses.slice(0, 2).join(', ')}).`,
    };
  } catch (err) {
    return {
      checked: true,
      resolved: false,
      errorCode: err.code || 'DNS_LOOKUP_FAILED',
      details: `DNS lookup failed: ${err.message || 'Domain does not exist or has expired.'}`,
    };
  }
}

/**
 * Message Content Analysis
 * Scans text for social-engineering triggers, urgency, threats, and requests for credentials.
 */
export function analyzeMessageText(text, claimedOrg = null) {
  if (!text || typeof text !== 'string') {
    return {
      indicatorsFound: [],
      severity: 'Low',
      summary: 'No message text provided for linguistic pattern analysis.',
    };
  }

  const indicators = [];

  for (const pattern of SCAM_INDICATOR_PATTERNS) {
    if (pattern.regex.test(text)) {
      indicators.push({
        category: pattern.category,
        label: pattern.label,
        severity: pattern.severity,
        description: pattern.description,
        safeGuidance: pattern.safeGuidance,
      });
    }
  }

  // Calculate highest severity
  let highestSeverity = 'Low';
  if (indicators.some((i) => i.severity === 'Critical')) {
    highestSeverity = 'Critical';
  } else if (indicators.some((i) => i.severity === 'High')) {
    highestSeverity = 'High';
  } else if (indicators.some((i) => i.severity === 'Medium')) {
    highestSeverity = 'Medium';
  }

  return {
    indicatorsFound: indicators,
    severity: highestSeverity,
    hasCriticalIndicators: highestSeverity === 'Critical',
    summary: indicators.length > 0
      ? `Detected ${indicators.length} known financial scam indicator(s): ${indicators.map((i) => i.label).join('; ')}.`
      : 'No high-frequency scam keywords detected in message text.',
  };
}

/**
 * Official Source Claim Verification
 * Matches any institution mentioned against official government databases and notices.
 */
export async function verifyOfficialEntityClaims(claimedOrg, messageText, matchedEntity = null) {
  const targetName = (claimedOrg || matchedEntity || '').trim().toLowerCase();
  const text = (messageText || '').toLowerCase();

  const results = [];

  // Match against known verified bank registry
  const matchedBank = VERIFIED_BANK_DOMAINS.find((b) => {
    if (targetName && [b.name.toLowerCase(), ...b.aliases].some((a) => targetName.includes(a))) {
      return true;
    }
    return [b.name.toLowerCase(), ...b.aliases].some((a) => a.length >= 3 && text.includes(a));
  });

  if (matchedBank) {
    results.push({
      organization: matchedBank.name,
      entityType: matchedBank.entityType,
      isRegulatedEntity: true,
      officialDomain: matchedBank.officialDomain,
      helpline: matchedBank.helpline,
      verificationSource: 'RBI Regulated Entity & Banking Registry',
      sourceUrl: matchedBank.phishingWarningUrl,
      claimStatus: 'claimed_entity_is_legitimate_institution',
      warning: `The organization "${matchedBank.name}" is an authentic regulated financial institution. However, scammers frequently impersonate authentic banks using spoofed SMS headers or fake URLs. Always inspect the actual sending domain and never share credentials.`,
    });
  }

  // Cross-reference with database sources
  try {
    const dbSources = await Source.find({ reviewStatus: 'verified' }).limit(5);
    for (const src of dbSources) {
      if (src.category === 'Cyber Safety & Scam Protection' || src.category === 'Banking & Payment Systems') {
        results.push({
          organization: src.organization,
          title: src.title,
          sourceUrl: src.url,
          verificationSource: 'FinLearn Official Regulatory Registry',
          lastReviewedDate: src.lastReviewedDate,
          retrievalStatus: src.retrievalStatus || 'available',
        });
      }
    }
  } catch (err) {
    console.warn('Could not query Source model for official claims:', err.message);
  }

  return results;
}
