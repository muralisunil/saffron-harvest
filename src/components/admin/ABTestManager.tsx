import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Pause, Play, BarChart3 } from "lucide-react";

interface ABTestVariant {
  id: string;
  test_id: string;
  name: string;
  subject_line: string;
  discount_percent: number;
  discount_code: string;
  weight: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  conversions: number;
}

interface ABTest {
  id: string;
  name: string;
  email_type: string;
  status: 'active' | 'paused' | 'completed';
  winning_variant_id: string | null;
  created_at: string;
  variants?: ABTestVariant[];
}

export function ABTestManager() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTest, setShowNewTest] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    email_type: 'first_recovery',
    variants: [
      { name: 'Variant A', subject_line: 'You left something behind!', discount_percent: 10, discount_code: 'COMEBACK10', weight: 50 },
      { name: 'Variant B', subject_line: 'Complete your order today!', discount_percent: 15, discount_code: 'SAVE15', weight: 50 }
    ]
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    const { data: testsData, error: testsError } = await supabase
      .from('email_ab_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (testsError) {
      toast.error('Failed to load A/B tests');
      return;
    }

    const testsWithVariants = await Promise.all(
      (testsData || []).map(async (test) => {
        const { data: variants } = await supabase
          .from('email_ab_test_variants')
          .select('*')
          .eq('test_id', test.id);
        return { ...test, variants: variants || [] };
      })
    );

    setTests(testsWithVariants);
    setLoading(false);
  };

  const createTest = async () => {
    if (!newTest.name.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    const { data: test, error: testError } = await supabase
      .from('email_ab_tests')
      .insert({ name: newTest.name, email_type: newTest.email_type })
      .select()
      .single();

    if (testError || !test) {
      toast.error('Failed to create test');
      return;
    }

    const variants = newTest.variants.map(v => ({
      test_id: test.id,
      name: v.name,
      subject_line: v.subject_line,
      discount_percent: v.discount_percent,
      discount_code: v.discount_code,
      weight: v.weight
    }));

    const { error: variantsError } = await supabase
      .from('email_ab_test_variants')
      .insert(variants);

    if (variantsError) {
      toast.error('Failed to create variants');
      return;
    }

    toast.success('A/B test created');
    setShowNewTest(false);
    setNewTest({
      name: '',
      email_type: 'first_recovery',
      variants: [
        { name: 'Variant A', subject_line: 'You left something behind!', discount_percent: 10, discount_code: 'COMEBACK10', weight: 50 },
        { name: 'Variant B', subject_line: 'Complete your order today!', discount_percent: 15, discount_code: 'SAVE15', weight: 50 }
      ]
    });
    fetchTests();
  };

  const toggleTestStatus = async (test: ABTest) => {
    const newStatus = test.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('email_ab_tests')
      .update({ status: newStatus })
      .eq('id', test.id);

    if (error) {
      toast.error('Failed to update test status');
      return;
    }

    toast.success(`Test ${newStatus === 'active' ? 'activated' : 'paused'}`);
    fetchTests();
  };

  const declareWinner = async (test: ABTest, variantId: string) => {
    const { error } = await supabase
      .from('email_ab_tests')
      .update({ status: 'completed', winning_variant_id: variantId })
      .eq('id', test.id);

    if (error) {
      toast.error('Failed to declare winner');
      return;
    }

    toast.success('Winner declared! This variant will be used for all future emails.');
    fetchTests();
  };

  const deleteTest = async (testId: string) => {
    const { error } = await supabase
      .from('email_ab_tests')
      .delete()
      .eq('id', testId);

    if (error) {
      toast.error('Failed to delete test');
      return;
    }

    toast.success('Test deleted');
    fetchTests();
  };

  const getConversionRate = (variant: ABTestVariant) => {
    if (variant.emails_sent === 0) return 0;
    return ((variant.conversions / variant.emails_sent) * 100).toFixed(1);
  };

  const getOpenRate = (variant: ABTestVariant) => {
    if (variant.emails_sent === 0) return 0;
    return ((variant.emails_opened / variant.emails_sent) * 100).toFixed(1);
  };

  const addVariant = () => {
    setNewTest(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: `Variant ${String.fromCharCode(65 + prev.variants.length)}`,
        subject_line: '',
        discount_percent: 10,
        discount_code: '',
        weight: Math.floor(100 / (prev.variants.length + 1))
      }]
    }));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setNewTest(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const removeVariant = (index: number) => {
    if (newTest.variants.length <= 2) {
      toast.error('A/B tests need at least 2 variants');
      return;
    }
    setNewTest(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading A/B tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">A/B Testing</h3>
          <p className="text-sm text-muted-foreground">Compare subject lines and offers</p>
        </div>
        <Button onClick={() => setShowNewTest(!showNewTest)}>
          <Plus className="h-4 w-4 mr-2" />
          New Test
        </Button>
      </div>

      {showNewTest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="e.g., Subject Line Test Q1"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Type</Label>
                <Select value={newTest.email_type} onValueChange={(v) => setNewTest({ ...newTest, email_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_recovery">First Recovery Email</SelectItem>
                    <SelectItem value="second_recovery">Second Recovery Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-3 w-3 mr-1" /> Add Variant
                </Button>
              </div>
              
              {newTest.variants.map((variant, idx) => (
                <Card key={idx} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{variant.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeVariant(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Subject Line</Label>
                        <Input
                          value={variant.subject_line}
                          onChange={(e) => updateVariant(idx, 'subject_line', e.target.value)}
                          placeholder="Email subject"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount Code</Label>
                        <Input
                          value={variant.discount_code}
                          onChange={(e) => updateVariant(idx, 'discount_code', e.target.value)}
                          placeholder="SAVE10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          value={variant.discount_percent}
                          onChange={(e) => updateVariant(idx, 'discount_percent', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Traffic Weight %</Label>
                        <Input
                          type="number"
                          value={variant.weight}
                          onChange={(e) => updateVariant(idx, 'weight', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTest(false)}>Cancel</Button>
              <Button onClick={createTest}>Create Test</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No A/B tests yet. Create one to start optimizing your recovery emails.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <Badge variant={test.status === 'active' ? 'default' : test.status === 'completed' ? 'secondary' : 'outline'}>
                      {test.status}
                    </Badge>
                    <Badge variant="outline">{test.email_type === 'first_recovery' ? '1st Email' : '2nd Email'}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {test.status !== 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => toggleTestStatus(test)}>
                        {test.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => deleteTest(test.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {test.variants?.map((variant) => (
                    <div
                      key={variant.id}
                      className={`p-3 rounded-lg border ${test.winning_variant_id === variant.id ? 'border-primary bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{variant.name}</span>
                          {test.winning_variant_id === variant.id && (
                            <Trophy className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        {test.status === 'active' && (
                          <Button variant="ghost" size="sm" onClick={() => declareWinner(test, variant.id)}>
                            <Trophy className="h-3 w-3 mr-1" /> Declare Winner
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">"{variant.subject_line}"</p>
                      <div className="flex gap-4 text-xs">
                        <span>Discount: {variant.discount_percent}% ({variant.discount_code})</span>
                        <span>Weight: {variant.weight}%</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Sent</p>
                          <p className="font-semibold">{variant.emails_sent}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Open Rate</p>
                          <p className="font-semibold">{getOpenRate(variant)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Click Rate</p>
                          <p className="font-semibold">
                            {variant.emails_sent > 0 ? ((variant.emails_clicked / variant.emails_sent) * 100).toFixed(1) : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversion</p>
                          <p className="font-semibold text-primary">{getConversionRate(variant)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
