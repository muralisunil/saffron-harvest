import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, Trash2, Trophy, Pause, Play, 
  FlaskConical, TrendingUp, Users, Target, 
  Calendar, Percent, ChevronDown, ChevronUp 
} from "lucide-react";
import { getExperimentStats, ExperimentStats } from "@/lib/offers/abTesting";

interface Offer {
  id: string;
  name: string;
  offer_type: string;
  status: string;
}

interface Variant {
  id?: string;
  name: string;
  description: string;
  weight: number;
  offer_ids: string[];
  is_control: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  traffic_percent: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  variants?: Variant[];
}

export function OfferExperimentManager() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [expandedExperiment, setExpandedExperiment] = useState<string | null>(null);
  const [experimentStats, setExperimentStats] = useState<Record<string, ExperimentStats[]>>({});
  
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    traffic_percent: 100,
    start_date: '',
    end_date: '',
    variants: [
      { name: 'Control', description: 'No offers applied', weight: 50, offer_ids: [] as string[], is_control: true },
      { name: 'Variant A', description: 'Test offers', weight: 50, offer_ids: [] as string[], is_control: false }
    ]
  });

  const fetchExperiments = useCallback(async () => {
    const { data: experimentsData, error: experimentsError } = await supabase
      .from('offer_experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (experimentsError) {
      toast.error('Failed to load experiments');
      return;
    }

    const experimentsWithVariants = await Promise.all(
      (experimentsData || []).map(async (exp) => {
        const { data: variants } = await supabase
          .from('offer_experiment_variants')
          .select('*')
          .eq('experiment_id', exp.id);
        return { 
          ...exp, 
          status: exp.status as Experiment['status'],
          variants: (variants || []).map(v => ({
            ...v,
            offer_ids: v.offer_ids || []
          }))
        };
      })
    );

    setExperiments(experimentsWithVariants);
    setLoading(false);
  }, []);

  const fetchOffers = useCallback(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('id, name, offer_type, status')
      .in('status', ['active', 'draft']);
    
    if (!error && data) {
      setOffers(data);
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
    fetchOffers();
  }, [fetchExperiments, fetchOffers]);

  const fetchStatsForExperiment = useCallback(async (experimentId: string) => {
    const stats = await getExperimentStats(experimentId);
    setExperimentStats(prev => ({ ...prev, [experimentId]: stats }));
  }, []);

  useEffect(() => {
    experiments
      .filter(exp => exp.status === 'running' || exp.status === 'completed')
      .forEach(exp => fetchStatsForExperiment(exp.id));
  }, [experiments, fetchStatsForExperiment]);

  const createExperiment = async () => {
    if (!newExperiment.name.trim()) {
      toast.error('Please enter an experiment name');
      return;
    }

    if (newExperiment.variants.length < 2) {
      toast.error('Need at least 2 variants');
      return;
    }

    const totalWeight = newExperiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      toast.error('Variant weights must sum to 100%');
      return;
    }

    const { data: experiment, error: expError } = await supabase
      .from('offer_experiments')
      .insert({
        name: newExperiment.name,
        description: newExperiment.description || null,
        traffic_percent: newExperiment.traffic_percent,
        start_date: newExperiment.start_date || null,
        end_date: newExperiment.end_date || null,
        status: 'draft'
      })
      .select()
      .single();

    if (expError || !experiment) {
      toast.error('Failed to create experiment');
      return;
    }

    const variantsToInsert = newExperiment.variants.map(v => ({
      experiment_id: experiment.id,
      name: v.name,
      description: v.description || null,
      weight: v.weight,
      offer_ids: v.offer_ids,
      is_control: v.is_control
    }));

    const { error: varError } = await supabase
      .from('offer_experiment_variants')
      .insert(variantsToInsert);

    if (varError) {
      toast.error('Failed to create variants');
      return;
    }

    toast.success('Experiment created');
    setShowNewExperiment(false);
    setNewExperiment({
      name: '',
      description: '',
      traffic_percent: 100,
      start_date: '',
      end_date: '',
      variants: [
        { name: 'Control', description: 'No offers applied', weight: 50, offer_ids: [], is_control: true },
        { name: 'Variant A', description: 'Test offers', weight: 50, offer_ids: [], is_control: false }
      ]
    });
    fetchExperiments();
  };

  const updateExperimentStatus = async (exp: Experiment, newStatus: Experiment['status']) => {
    const { error } = await supabase
      .from('offer_experiments')
      .update({ status: newStatus })
      .eq('id', exp.id);

    if (error) {
      toast.error('Failed to update experiment status');
      return;
    }

    toast.success(`Experiment ${newStatus === 'running' ? 'started' : newStatus}`);
    fetchExperiments();
  };

  const deleteExperiment = async (expId: string) => {
    const { error } = await supabase
      .from('offer_experiments')
      .delete()
      .eq('id', expId);

    if (error) {
      toast.error('Failed to delete experiment');
      return;
    }

    toast.success('Experiment deleted');
    fetchExperiments();
  };

  const addVariant = () => {
    const newVariantName = `Variant ${String.fromCharCode(65 + newExperiment.variants.length - 1)}`;
    const newWeight = Math.floor(100 / (newExperiment.variants.length + 1));
    
    setNewExperiment(prev => ({
      ...prev,
      variants: [
        ...prev.variants.map(v => ({ ...v, weight: newWeight })),
        { name: newVariantName, description: '', weight: newWeight, offer_ids: [], is_control: false }
      ]
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: unknown) => {
    setNewExperiment(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const removeVariant = (index: number) => {
    if (newExperiment.variants.length <= 2) {
      toast.error('Experiments need at least 2 variants');
      return;
    }
    setNewExperiment(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const toggleOfferInVariant = (variantIndex: number, offerId: string) => {
    setNewExperiment(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => {
        if (i !== variantIndex) return v;
        const newOfferIds = v.offer_ids.includes(offerId)
          ? v.offer_ids.filter(id => id !== offerId)
          : [...v.offer_ids, offerId];
        return { ...v, offer_ids: newOfferIds };
      })
    }));
  };

  const getStatusColor = (status: Experiment['status']) => {
    switch (status) {
      case 'running': return 'default';
      case 'draft': return 'secondary';
      case 'paused': return 'outline';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  const getOfferName = (offerId: string) => {
    return offers.find(o => o.id === offerId)?.name || offerId;
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading experiments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Offer Experiments
          </h3>
          <p className="text-sm text-muted-foreground">A/B test different offer strategies</p>
        </div>
        <Button onClick={() => setShowNewExperiment(!showNewExperiment)}>
          <Plus className="h-4 w-4 mr-2" />
          New Experiment
        </Button>
      </div>

      {showNewExperiment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Experiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Experiment Name</Label>
                <Input
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                  placeholder="e.g., Summer Sale Discount Test"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                  placeholder="Testing 10% vs 15% discount"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Traffic Allocation: {newExperiment.traffic_percent}%
                </Label>
                <Slider
                  value={[newExperiment.traffic_percent]}
                  onValueChange={([v]) => setNewExperiment({ ...newExperiment, traffic_percent: v })}
                  max={100}
                  min={1}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {newExperiment.traffic_percent}% of visitors will be included in this experiment
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date (optional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newExperiment.start_date}
                    onChange={(e) => setNewExperiment({ ...newExperiment, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date (optional)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newExperiment.end_date}
                    onChange={(e) => setNewExperiment({ ...newExperiment, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-3 w-3 mr-1" /> Add Variant
                </Button>
              </div>
              
              {newExperiment.variants.map((variant, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{variant.name}</span>
                        {variant.is_control && <Badge variant="secondary">Control</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeVariant(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Weight %</Label>
                        <Input
                          type="number"
                          value={variant.weight}
                          onChange={(e) => updateVariant(idx, 'weight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2 flex items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={variant.is_control}
                            onCheckedChange={(checked) => updateVariant(idx, 'is_control', checked)}
                          />
                          <Label className="text-xs">Control Group</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Offers in this variant</Label>
                      <div className="flex flex-wrap gap-2">
                        {offers.map(offer => (
                          <Badge
                            key={offer.id}
                            variant={variant.offer_ids.includes(offer.id) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleOfferInVariant(idx, offer.id)}
                          >
                            {offer.name}
                          </Badge>
                        ))}
                        {offers.length === 0 && (
                          <span className="text-xs text-muted-foreground">No offers available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="text-xs text-muted-foreground text-right">
                Total weight: {newExperiment.variants.reduce((s, v) => s + v.weight, 0)}%
                {newExperiment.variants.reduce((s, v) => s + v.weight, 0) !== 100 && (
                  <span className="text-destructive ml-2">(must be 100%)</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewExperiment(false)}>Cancel</Button>
              <Button onClick={createExperiment}>Create Experiment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {experiments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No experiments yet. Create one to start A/B testing your offers.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => {
            const isExpanded = expandedExperiment === exp.id;
            const stats = experimentStats[exp.id] || [];
            
            return (
              <Card key={exp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setExpandedExperiment(isExpanded ? null : exp.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <CardTitle className="text-base">{exp.name}</CardTitle>
                      <Badge variant={getStatusColor(exp.status)}>{exp.status}</Badge>
                      <Badge variant="outline">{exp.traffic_percent}% traffic</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {exp.status === 'draft' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => updateExperimentStatus(exp, 'running')}
                        >
                          <Play className="h-4 w-4 mr-1" /> Start
                        </Button>
                      )}
                      {exp.status === 'running' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateExperimentStatus(exp, 'paused')}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {exp.status === 'paused' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateExperimentStatus(exp, 'running')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {(exp.status === 'running' || exp.status === 'paused') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateExperimentStatus(exp, 'completed')}
                        >
                          <Trophy className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteExperiment(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {exp.variants?.map((variant) => {
                        const variantStats = stats.find(s => s.variant_id === variant.id);
                        
                        return (
                          <div
                            key={variant.id}
                            className={`p-4 rounded-lg border ${variant.is_control ? 'border-muted bg-muted/30' : 'border-border'}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{variant.name}</span>
                                {variant.is_control && <Badge variant="secondary">Control</Badge>}
                                <Badge variant="outline">{variant.weight}% weight</Badge>
                              </div>
                            </div>

                            {variant.offer_ids.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {variant.offer_ids.map(offerId => (
                                  <Badge key={offerId} variant="default" className="text-xs">
                                    {getOfferName(offerId)}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">No offers (control group)</p>
                            )}

                            {variantStats && (exp.status === 'running' || exp.status === 'completed') && (
                              <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Assignments</p>
                                    <p className="font-semibold">{variantStats.assignments_count}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Exposures</p>
                                    <p className="font-semibold">{variantStats.exposures_count}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Conversions</p>
                                    <p className="font-semibold">{variantStats.conversions_count}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                                  <div className="flex items-center gap-2">
                                    <Progress value={variantStats.conversion_rate} className="h-2 flex-1" />
                                    <span className="font-semibold text-sm">{variantStats.conversion_rate.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
