import { useState, useEffect } from "react";
import { Settings, Mail, Clock, Percent, Tag, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RecoverySettings {
  id: string;
  abandonment_threshold_minutes: number;
  first_email_discount_code: string;
  first_email_discount_percent: number;
  second_email_delay_hours: number;
  second_email_discount_code: string;
  second_email_discount_percent: number;
  enabled: boolean;
}

const RecoveryEmailSettings = () => {
  const [settings, setSettings] = useState<RecoverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("recovery_email_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load recovery email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("recovery_email_settings")
        .update({
          abandonment_threshold_minutes: settings.abandonment_threshold_minutes,
          first_email_discount_code: settings.first_email_discount_code,
          first_email_discount_percent: settings.first_email_discount_percent,
          second_email_delay_hours: settings.second_email_delay_hours,
          second_email_discount_code: settings.second_email_discount_code,
          second_email_discount_percent: settings.second_email_discount_percent,
          enabled: settings.enabled,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Recovery email settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof RecoverySettings>(
    field: K,
    value: RecoverySettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">No settings found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Cart Recovery Email Settings
            </CardTitle>
            <CardDescription className="mt-1">
              Configure automated recovery emails for abandoned carts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enabled" className="text-sm">Enabled</Label>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Abandonment Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">Abandonment Threshold</Label>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={15}
              max={1440}
              value={settings.abandonment_threshold_minutes}
              onChange={(e) => updateField("abandonment_threshold_minutes", parseInt(e.target.value) || 60)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">
              minutes before sending first recovery email
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            First Recovery Email
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Discount Code
              </Label>
              <Input
                value={settings.first_email_discount_code}
                onChange={(e) => updateField("first_email_discount_code", e.target.value.toUpperCase())}
                placeholder="COMEBACK10"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5" />
                Discount Percent
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.first_email_discount_percent}
                  onChange={(e) => updateField("first_email_discount_percent", parseInt(e.target.value) || 10)}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Second Recovery Email
          </h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Send After
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={settings.second_email_delay_hours}
                  onChange={(e) => updateField("second_email_delay_hours", parseInt(e.target.value) || 24)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  hours after first email
                </span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Discount Code
                </Label>
                <Input
                  value={settings.second_email_discount_code}
                  onChange={(e) => updateField("second_email_discount_code", e.target.value.toUpperCase())}
                  placeholder="COMEBACK20"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" />
                  Discount Percent
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={settings.second_email_discount_percent}
                    onChange={(e) => updateField("second_email_discount_percent", parseInt(e.target.value) || 20)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecoveryEmailSettings;
