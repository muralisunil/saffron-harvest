import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// Types
export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  start_date?: string | null;
  end_date?: string | null;
  traffic_percent: number;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  description?: string | null;
  weight: number;
  offer_ids: string[];
  is_control: boolean;
  created_at: string;
}

export interface VariantAssignment {
  id: string;
  experiment_id: string;
  user_id?: string | null;
  session_id?: string | null;
  variant_id: string;
  assigned_at: string;
}

export interface ExposureLog {
  experiment_id: string;
  variant_id: string;
  user_id?: string | null;
  session_id?: string | null;
  offer_id?: string | null;
  context?: Json;
}

export interface ConversionLog {
  experiment_id: string;
  variant_id: string;
  user_id?: string | null;
  session_id?: string | null;
  conversion_type: string;
  conversion_value?: number | null;
  order_id?: string | null;
  properties?: Json;
}

export interface ABTestContext {
  user_id?: string;
  session_id: string;
}

export interface ExperimentWithVariants extends Experiment {
  variants: ExperimentVariant[];
}

// Hash function for stable assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Determine if user should be in experiment based on traffic percent
function isInTrafficAllocation(
  experimentId: string,
  identifier: string,
  trafficPercent: number
): boolean {
  const hash = hashString(`${experimentId}:${identifier}:traffic`);
  return (hash % 100) < trafficPercent;
}

// Select variant based on weights using consistent hashing
function selectVariantByWeight(
  experimentId: string,
  identifier: string,
  variants: ExperimentVariant[]
): ExperimentVariant | null {
  if (variants.length === 0) return null;
  
  // Calculate total weight
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) return variants[0];
  
  // Get hash-based position
  const hash = hashString(`${experimentId}:${identifier}:variant`);
  const position = hash % totalWeight;
  
  // Find variant at position
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (position < cumulative) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

// Fetch active experiments
export async function fetchActiveExperiments(): Promise<ExperimentWithVariants[]> {
  const now = new Date().toISOString();
  
  const { data: experiments, error: expError } = await supabase
    .from('offer_experiments')
    .select('*')
    .eq('status', 'running')
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`);
  
  if (expError || !experiments?.length) {
    return [];
  }
  
  const experimentIds = experiments.map(e => e.id);
  
  const { data: variants, error: varError } = await supabase
    .from('offer_experiment_variants')
    .select('*')
    .in('experiment_id', experimentIds);
  
  if (varError) {
    console.error('Error fetching variants:', varError);
    return [];
  }
  
  return experiments.map(exp => ({
    ...exp,
    status: exp.status as Experiment['status'],
    variants: (variants || [])
      .filter(v => v.experiment_id === exp.id)
      .map(v => ({
        ...v,
        offer_ids: v.offer_ids || []
      }))
  }));
}

// Get or create stable variant assignment
export async function getOrCreateAssignment(
  experiment: ExperimentWithVariants,
  context: ABTestContext
): Promise<ExperimentVariant | null> {
  const identifier = context.user_id || context.session_id;
  
  // Check if user is in traffic allocation
  if (!isInTrafficAllocation(experiment.id, identifier, experiment.traffic_percent)) {
    return null;
  }
  
  // Try to get existing assignment
  let query = supabase
    .from('offer_experiment_assignments')
    .select('variant_id')
    .eq('experiment_id', experiment.id);
  
  if (context.user_id) {
    query = query.eq('user_id', context.user_id);
  } else {
    query = query.eq('session_id', context.session_id);
  }
  
  const { data: existing } = await query.maybeSingle();
  
  if (existing) {
    return experiment.variants.find(v => v.id === existing.variant_id) || null;
  }
  
  // Create new assignment
  const selectedVariant = selectVariantByWeight(experiment.id, identifier, experiment.variants);
  if (!selectedVariant) return null;
  
  const insertData = {
    experiment_id: experiment.id,
    variant_id: selectedVariant.id,
    user_id: context.user_id || null,
    session_id: context.user_id ? null : context.session_id
  };
  
  await supabase
    .from('offer_experiment_assignments')
    .insert(insertData);
  
  return selectedVariant;
}

// Get all variant assignments for a user/session
export async function getVariantAssignments(
  context: ABTestContext
): Promise<Map<string, ExperimentVariant>> {
  const assignments = new Map<string, ExperimentVariant>();
  
  const experiments = await fetchActiveExperiments();
  
  for (const experiment of experiments) {
    const variant = await getOrCreateAssignment(experiment, context);
    if (variant) {
      assignments.set(experiment.id, variant);
    }
  }
  
  return assignments;
}

// Get offer IDs that should be active based on variant assignments
export async function getExperimentOfferIds(
  context: ABTestContext
): Promise<{ 
  activeOfferIds: Set<string>; 
  excludedOfferIds: Set<string>;
  assignments: Map<string, ExperimentVariant>;
}> {
  const activeOfferIds = new Set<string>();
  const excludedOfferIds = new Set<string>();
  const assignments = await getVariantAssignments(context);
  
  // Get all experiments to know which offers are being tested
  const experiments = await fetchActiveExperiments();
  
  for (const experiment of experiments) {
    const assignedVariant = assignments.get(experiment.id);
    
    // Collect all offer IDs from all variants
    const allExperimentOfferIds = new Set<string>();
    for (const variant of experiment.variants) {
      for (const offerId of variant.offer_ids) {
        allExperimentOfferIds.add(offerId);
      }
    }
    
    if (assignedVariant) {
      // Add offers from assigned variant to active
      for (const offerId of assignedVariant.offer_ids) {
        activeOfferIds.add(offerId);
      }
      
      // Exclude offers from other variants
      for (const offerId of allExperimentOfferIds) {
        if (!assignedVariant.offer_ids.includes(offerId)) {
          excludedOfferIds.add(offerId);
        }
      }
    } else {
      // User not in experiment - exclude all experiment offers
      for (const offerId of allExperimentOfferIds) {
        excludedOfferIds.add(offerId);
      }
    }
  }
  
  return { activeOfferIds, excludedOfferIds, assignments };
}

// Log exposure event
export async function logExposure(log: ExposureLog): Promise<void> {
  await supabase
    .from('offer_experiment_exposures')
    .insert({
      experiment_id: log.experiment_id,
      variant_id: log.variant_id,
      user_id: log.user_id || null,
      session_id: log.session_id || null,
      offer_id: log.offer_id || null,
      context: log.context ?? {}
    });
}

// Log multiple exposures at once
export async function logExposures(logs: ExposureLog[]): Promise<void> {
  if (logs.length === 0) return;
  
  const insertData = logs.map(log => ({
    experiment_id: log.experiment_id,
    variant_id: log.variant_id,
    user_id: log.user_id || null,
    session_id: log.session_id || null,
    offer_id: log.offer_id || null,
    context: log.context ?? {}
  }));
  
  await supabase
    .from('offer_experiment_exposures')
    .insert(insertData);
}

// Log conversion event
export async function logConversion(log: ConversionLog): Promise<void> {
  await supabase
    .from('offer_experiment_conversions')
    .insert({
      experiment_id: log.experiment_id,
      variant_id: log.variant_id,
      user_id: log.user_id || null,
      session_id: log.session_id || null,
      conversion_type: log.conversion_type,
      conversion_value: log.conversion_value ?? null,
      order_id: log.order_id || null,
      properties: log.properties ?? {}
    });
}

// Log conversions for all active experiments
export async function logConversionsForActiveExperiments(
  context: ABTestContext,
  conversionType: string,
  conversionValue?: number,
  orderId?: string,
  properties?: Json
): Promise<void> {
  const assignments = await getVariantAssignments(context);
  
  const conversions: ConversionLog[] = [];
  for (const [experimentId, variant] of assignments) {
    conversions.push({
      experiment_id: experimentId,
      variant_id: variant.id,
      user_id: context.user_id,
      session_id: context.session_id,
      conversion_type: conversionType,
      conversion_value: conversionValue,
      order_id: orderId,
      properties
    });
  }
  
  if (conversions.length > 0) {
    const insertData = conversions.map(c => ({
      experiment_id: c.experiment_id,
      variant_id: c.variant_id,
      user_id: c.user_id || null,
      session_id: c.session_id || null,
      conversion_type: c.conversion_type,
      conversion_value: c.conversion_value ?? null,
      order_id: c.order_id || null,
      properties: c.properties ?? {}
    }));
    
    await supabase
      .from('offer_experiment_conversions')
      .insert(insertData);
  }
}

// Get experiment statistics
export interface ExperimentStats {
  experiment_id: string;
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  assignments_count: number;
  exposures_count: number;
  conversions_count: number;
  total_conversion_value: number;
  conversion_rate: number;
}

export async function getExperimentStats(experimentId: string): Promise<ExperimentStats[]> {
  const { data: variants } = await supabase
    .from('offer_experiment_variants')
    .select('*')
    .eq('experiment_id', experimentId);
  
  if (!variants?.length) return [];
  
  const stats: ExperimentStats[] = [];
  
  for (const variant of variants) {
    // Get assignment count
    const { count: assignmentsCount } = await supabase
      .from('offer_experiment_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('variant_id', variant.id);
    
    // Get exposure count
    const { count: exposuresCount } = await supabase
      .from('offer_experiment_exposures')
      .select('*', { count: 'exact', head: true })
      .eq('variant_id', variant.id);
    
    // Get conversions
    const { data: conversions } = await supabase
      .from('offer_experiment_conversions')
      .select('conversion_value')
      .eq('variant_id', variant.id);
    
    const conversionsCount = conversions?.length || 0;
    const totalValue = conversions?.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0) || 0;
    
    stats.push({
      experiment_id: experimentId,
      variant_id: variant.id,
      variant_name: variant.name,
      is_control: variant.is_control,
      assignments_count: assignmentsCount || 0,
      exposures_count: exposuresCount || 0,
      conversions_count: conversionsCount,
      total_conversion_value: totalValue,
      conversion_rate: (assignmentsCount || 0) > 0 
        ? (conversionsCount / (assignmentsCount || 1)) * 100 
        : 0
    });
  }
  
  return stats;
}
