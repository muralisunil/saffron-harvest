// Conflict resolution system for offer stacking and priority-based selection
import { Offer, ApplicationPlan, StackingPolicy } from './types';

export type RejectionReason = 
  | 'exclusive_conflict'
  | 'stack_group_conflict'
  | 'lower_priority'
  | 'same_line_conflict'
  | 'budget_exceeded'
  | 'max_offers_reached';

export interface RejectionLog {
  offer_id: string;
  offer_name: string;
  reason: RejectionReason;
  conflicting_offer_id?: string;
  conflicting_offer_name?: string;
  details: string;
  timestamp: Date;
}

export interface ConflictResolutionResult {
  accepted_plans: ApplicationPlan[];
  rejected_plans: Array<{ plan: ApplicationPlan; offer: Offer }>;
  rejection_logs: RejectionLog[];
  total_discount: number;
}

export interface ConflictResolverOptions {
  max_offers?: number;
  max_total_discount?: number;
  max_discount_percent?: number;
  cart_subtotal: number;
}

/**
 * Resolves conflicts between multiple applicable offers based on:
 * 1. Priority (lower number = higher priority)
 * 2. Stacking policy (stackable, exclusive, stack_group)
 * 3. Line-item conflicts
 */
export function resolveConflicts(
  plans: ApplicationPlan[],
  offers: Offer[],
  options: ConflictResolverOptions
): ConflictResolutionResult {
  const offerMap = new Map(offers.map(o => [o.id, o]));
  const rejectionLogs: RejectionLog[] = [];
  const acceptedPlans: ApplicationPlan[] = [];
  const rejectedPlans: Array<{ plan: ApplicationPlan; offer: Offer }> = [];
  
  // Track which line items have been claimed by exclusive offers
  const claimedLines = new Map<string, { offerId: string; offerName: string }>();
  
  // Track active stack groups
  const activeStackGroups = new Set<string>();
  
  // Track if we have an exclusive offer
  let hasExclusiveOffer = false;
  let exclusiveOfferId: string | null = null;
  let exclusiveOfferName: string | null = null;
  
  let totalDiscount = 0;

  // Plans should already be sorted by priority from evaluator
  for (const plan of plans) {
    const offer = offerMap.get(plan.offer_id);
    if (!offer) continue;

    const rejection = checkForConflicts(
      plan,
      offer,
      {
        hasExclusiveOffer,
        exclusiveOfferId,
        exclusiveOfferName,
        activeStackGroups,
        claimedLines,
        totalDiscount,
        acceptedPlansCount: acceptedPlans.length,
      },
      options
    );

    if (rejection) {
      rejectionLogs.push(rejection);
      rejectedPlans.push({ plan, offer });
      continue;
    }

    // Accept the plan
    acceptedPlans.push(plan);
    totalDiscount += plan.total_discount;

    // Update state based on accepted offer
    if (offer.stacking_policy === 'exclusive') {
      hasExclusiveOffer = true;
      exclusiveOfferId = offer.id;
      exclusiveOfferName = offer.name;
      // Claim all lines for exclusive offer
      for (const lineId of plan.affected_line_ids) {
        claimedLines.set(lineId, { offerId: offer.id, offerName: offer.name });
      }
    } else if (offer.stacking_policy === 'stack_group' && offer.stack_group) {
      activeStackGroups.add(offer.stack_group);
    }
  }

  return {
    accepted_plans: acceptedPlans,
    rejected_plans: rejectedPlans,
    rejection_logs: rejectionLogs,
    total_discount: totalDiscount,
  };
}

interface ConflictCheckState {
  hasExclusiveOffer: boolean;
  exclusiveOfferId: string | null;
  exclusiveOfferName: string | null;
  activeStackGroups: Set<string>;
  claimedLines: Map<string, { offerId: string; offerName: string }>;
  totalDiscount: number;
  acceptedPlansCount: number;
}

function checkForConflicts(
  plan: ApplicationPlan,
  offer: Offer,
  state: ConflictCheckState,
  options: ConflictResolverOptions
): RejectionLog | null {
  const {
    hasExclusiveOffer,
    exclusiveOfferId,
    exclusiveOfferName,
    activeStackGroups,
    claimedLines,
    totalDiscount,
    acceptedPlansCount,
  } = state;

  // Check max offers limit
  if (options.max_offers && acceptedPlansCount >= options.max_offers) {
    return createRejectionLog(offer, 'max_offers_reached', {
      details: `Maximum ${options.max_offers} offers already applied`,
    });
  }

  // Check max total discount
  if (options.max_total_discount) {
    const newTotal = totalDiscount + plan.total_discount;
    if (newTotal > options.max_total_discount) {
      return createRejectionLog(offer, 'budget_exceeded', {
        details: `Total discount ${newTotal.toFixed(2)} would exceed maximum ${options.max_total_discount.toFixed(2)}`,
      });
    }
  }

  // Check max discount percentage
  if (options.max_discount_percent && options.cart_subtotal > 0) {
    const currentPercent = (totalDiscount / options.cart_subtotal) * 100;
    const newPercent = ((totalDiscount + plan.total_discount) / options.cart_subtotal) * 100;
    if (newPercent > options.max_discount_percent) {
      return createRejectionLog(offer, 'budget_exceeded', {
        details: `Total discount ${newPercent.toFixed(1)}% would exceed maximum ${options.max_discount_percent}%`,
      });
    }
  }

  // Check exclusive offer conflicts
  if (hasExclusiveOffer) {
    // If we already have an exclusive offer, reject all others
    return createRejectionLog(offer, 'exclusive_conflict', {
      conflicting_offer_id: exclusiveOfferId!,
      conflicting_offer_name: exclusiveOfferName!,
      details: `Cannot stack with exclusive offer "${exclusiveOfferName}"`,
    });
  }

  // If this offer is exclusive and we already have other offers, reject
  if (offer.stacking_policy === 'exclusive' && acceptedPlansCount > 0) {
    return createRejectionLog(offer, 'lower_priority', {
      details: `Exclusive offer rejected - other offers already applied with higher priority`,
    });
  }

  // Check stack group conflicts
  if (offer.stacking_policy === 'stack_group') {
    if (!offer.stack_group) {
      // stack_group policy but no group defined - treat as exclusive
      if (acceptedPlansCount > 0) {
        return createRejectionLog(offer, 'stack_group_conflict', {
          details: `Stack group policy but no group defined - cannot stack`,
        });
      }
    } else if (activeStackGroups.size > 0 && !activeStackGroups.has(offer.stack_group)) {
      // Different stack group already active
      const activeGroup = Array.from(activeStackGroups)[0];
      return createRejectionLog(offer, 'stack_group_conflict', {
        details: `Stack group "${offer.stack_group}" conflicts with active group "${activeGroup}"`,
      });
    }
  }

  // Check if stackable offer conflicts with stack_group offers
  if (offer.stacking_policy === 'stackable' && activeStackGroups.size > 0) {
    // Stackable offers can coexist with stack_group offers
    // No conflict here
  }

  // Check line-item conflicts for exclusive offers claiming specific lines
  // (For future use - currently we don't enforce line-level exclusivity for stackable offers)

  return null;
}

function createRejectionLog(
  offer: Offer,
  reason: RejectionReason,
  options: {
    conflicting_offer_id?: string;
    conflicting_offer_name?: string;
    details: string;
  }
): RejectionLog {
  return {
    offer_id: offer.id,
    offer_name: offer.name,
    reason,
    conflicting_offer_id: options.conflicting_offer_id,
    conflicting_offer_name: options.conflicting_offer_name,
    details: options.details,
    timestamp: new Date(),
  };
}

/**
 * Determines if two offers can stack together based on their stacking policies
 */
export function canOffersStack(offerA: Offer, offerB: Offer): boolean {
  // Exclusive offers never stack
  if (offerA.stacking_policy === 'exclusive' || offerB.stacking_policy === 'exclusive') {
    return false;
  }

  // Stackable offers always stack with other stackable offers
  if (offerA.stacking_policy === 'stackable' && offerB.stacking_policy === 'stackable') {
    return true;
  }

  // Stack group offers only stack within the same group
  if (offerA.stacking_policy === 'stack_group' && offerB.stacking_policy === 'stack_group') {
    return offerA.stack_group === offerB.stack_group;
  }

  // Stackable can stack with stack_group
  if (
    (offerA.stacking_policy === 'stackable' && offerB.stacking_policy === 'stack_group') ||
    (offerA.stacking_policy === 'stack_group' && offerB.stacking_policy === 'stackable')
  ) {
    return true;
  }

  return false;
}

/**
 * Gets a human-readable explanation of why an offer was rejected
 */
export function getRejectReasonMessage(log: RejectionLog): string {
  switch (log.reason) {
    case 'exclusive_conflict':
      return `"${log.offer_name}" cannot be combined with "${log.conflicting_offer_name}" (exclusive offer)`;
    case 'stack_group_conflict':
      return `"${log.offer_name}" belongs to a different promotion group`;
    case 'lower_priority':
      return `"${log.offer_name}" has lower priority than already applied offers`;
    case 'same_line_conflict':
      return `"${log.offer_name}" affects items already discounted by another offer`;
    case 'budget_exceeded':
      return `"${log.offer_name}" would exceed maximum discount limit`;
    case 'max_offers_reached':
      return `Maximum number of offers already applied`;
    default:
      return log.details;
  }
}
