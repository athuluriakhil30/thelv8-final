'use client';

import { useEffect, useState } from 'react';
import { Snowflake, Leaf, CloudRain, Sparkles, CalendarDays } from 'lucide-react';
import { seasonalService } from '@/services/seasonal.service';
import { formatDate } from '@/lib/helpers';
import { toast } from 'sonner';
import type { SeasonalSetting } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SeasonalPage() {
  const [seasons, setSeasons] = useState<SeasonalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSeasons();
  }, []);

  async function loadSeasons() {
    try {
      setLoading(true);
      const data = await seasonalService.getAllSeasons();
      setSeasons(data);
    } catch (error) {
      console.error('Error loading seasons:', error);
      toast.error('Failed to load seasonal settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(season: SeasonalSetting) {
    try {
      setSaving(season.id);
      
      // If activating this season, deactivate all others
      if (!season.is_active) {
        await Promise.all(
          seasons
            .filter(s => s.id !== season.id && s.is_active)
            .map(s => seasonalService.toggleSeasonStatus(s.id, false))
        );
      }
      
      await seasonalService.toggleSeasonStatus(season.id, !season.is_active);
      toast.success(`${season.season} ${!season.is_active ? 'activated' : 'deactivated'}`);
      loadSeasons();
    } catch (error) {
      console.error('Error toggling season:', error);
      toast.error('Failed to update season status');
    } finally {
      setSaving(null);
    }
  }

  async function handleUpdateSeason(season: SeasonalSetting, field: string, value: any) {
    try {
      setSaving(season.id);
      await seasonalService.updateSeason(season.id, { [field]: value });
      toast.success('Season updated successfully');
      loadSeasons();
    } catch (error) {
      console.error('Error updating season:', error);
      toast.error('Failed to update season');
    } finally {
      setSaving(null);
    }
  }

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'winter':
        return <Snowflake className="w-6 h-6 text-blue-500" />;
      case 'spring':
        return <Sparkles className="w-6 h-6 text-pink-500" />;
      case 'summer':
        return <CloudRain className="w-6 h-6 text-yellow-500" />;
      case 'autumn':
        return <Leaf className="w-6 h-6 text-orange-500" />;
      default:
        return <CalendarDays className="w-6 h-6 text-stone-500" />;
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'winter':
        return 'from-blue-50 to-cyan-50';
      case 'spring':
        return 'from-pink-50 to-rose-50';
      case 'summer':
        return 'from-yellow-50 to-amber-50';
      case 'autumn':
        return 'from-orange-50 to-red-50';
      default:
        return 'from-stone-50 to-stone-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mb-4"></div>
          <p className="text-stone-600">Loading seasonal settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-stone-900 mb-2">Seasonal Animations</h1>
        <p className="text-stone-600">
          Control seasonal effects and animations for your website
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {seasons.map((season) => (
          <Card
            key={season.id}
            className={`bg-gradient-to-br ${getSeasonColor(season.season)} border-2 ${
              season.is_active ? 'border-stone-900 shadow-lg' : 'border-stone-200'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSeasonIcon(season.season)}
                  <div>
                    <CardTitle className="capitalize text-2xl">
                      {season.season}
                    </CardTitle>
                    <CardDescription>
                      {season.start_date && season.end_date && (
                        <span className="text-xs">
                          {formatDate(season.start_date)} - {formatDate(season.end_date)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={season.is_active}
                  onCheckedChange={() => handleToggleActive(season)}
                  disabled={!!saving}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Animation Type */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Animation Type</Label>
                <Select
                  value={season.animation_type}
                  onValueChange={(value) =>
                    handleUpdateSeason(season, 'animation_type', value)
                  }
                  disabled={!!saving}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="snow">❄️ Snow</SelectItem>
                    <SelectItem value="rain">🌧️ Rain</SelectItem>
                    <SelectItem value="leaves">🍂 Falling Leaves</SelectItem>
                    <SelectItem value="petals">🌸 Flower Petals</SelectItem>
                    <SelectItem value="stars">✨ Stars</SelectItem>
                    <SelectItem value="none">🚫 None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Animation Intensity */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Intensity</Label>
                <Select
                  value={season.animation_intensity}
                  onValueChange={(value) =>
                    handleUpdateSeason(season, 'animation_intensity', value)
                  }
                  disabled={!!saving || season.animation_type === 'none'}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Start Date</Label>
                  <Input
                    type="date"
                    value={season.start_date || ''}
                    onChange={(e) =>
                      handleUpdateSeason(season, 'start_date', e.target.value)
                    }
                    className="bg-white"
                    disabled={!!saving}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">End Date</Label>
                  <Input
                    type="date"
                    value={season.end_date || ''}
                    onChange={(e) =>
                      handleUpdateSeason(season, 'end_date', e.target.value)
                    }
                    className="bg-white"
                    disabled={!!saving}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    season.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {season.is_active ? '✓ Active' : '○ Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-stone-700">
          <p>
            • <strong>Only one season can be active</strong> at a time. Activating a new season
            will automatically deactivate others.
          </p>
          <p>
            • Animations appear on <strong>all pages except</strong> cart, checkout, and order
            success pages.
          </p>
          <p>
            • <strong>Cursor interaction:</strong> Users can interact with falling elements by
            moving their mouse.
          </p>
          <p>
            • <strong>Performance:</strong> Animations use canvas rendering for smooth performance.
          </p>
          <p>
            • Set date ranges to automatically activate/deactivate seasons based on the calendar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
