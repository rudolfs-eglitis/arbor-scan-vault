import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tree } from '@/hooks/useTreeAssessment';
import { supabase } from '@/integrations/supabase/client';
import { TreeLocationSection } from './TreeLocationSection';

const treeFormSchema = z.object({
  tree_number: z.string().optional(),
  species_id: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  dbh_cm: z.number().min(1).max(1500).optional(),
  height_m: z.number().min(1).max(120).optional(),
  crown_spread_m: z.number().min(0).optional(),
  age_estimate: z.number().min(0).optional(),
  location_description: z.string().optional(),
  site_conditions: z.string().optional(),
  ownership: z.string().optional(),
  protected_status: z.boolean().default(false),
  notes: z.string().optional(),
});

type TreeFormData = z.infer<typeof treeFormSchema>;

interface TreeFormProps {
  tree?: Tree;
  defaultLocation?: { lat: number; lng: number };
  onSubmit: (data: TreeFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TreeForm({ tree, defaultLocation, onSubmit, onCancel, loading }: TreeFormProps) {
  const [species, setSpecies] = useState<Array<{ id: string; scientific_name: string; common_names?: string[] }>>([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);

  const form = useForm<TreeFormData>({
    resolver: zodResolver(treeFormSchema),
    defaultValues: {
      tree_number: tree?.tree_number || '',
      species_id: tree?.species_id || '',
      latitude: tree?.latitude || undefined,
      longitude: tree?.longitude || undefined,
      lat: tree?.lat || tree?.latitude || defaultLocation?.lat || 59.3293,
      lng: tree?.lng || tree?.longitude || defaultLocation?.lng || 18.0686,
      dbh_cm: tree?.dbh_cm || undefined,
      height_m: tree?.height_m || undefined,
      crown_spread_m: tree?.crown_spread_m || undefined,
      age_estimate: tree?.age_estimate || undefined,
      location_description: tree?.location_description || '',
      site_conditions: tree?.site_conditions || '',
      ownership: tree?.ownership || '',
      protected_status: tree?.protected_status || false,
      notes: tree?.notes || '',
    },
  });

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const { data, error } = await supabase
          .from('species')
          .select('id, scientific_name, common_names')
          .order('scientific_name');

        if (error) throw error;
        setSpecies(data || []);
      } catch (error) {
        console.error('Error fetching species:', error);
      } finally {
        setLoadingSpecies(false);
      }
    };

    fetchSpecies();
  }, []);

  const handleSubmit = async (data: TreeFormData) => {
    try {
      if (!data.lat || !data.lng) {
        console.error("Missing coordinates:", data);
        return;
      }
      
      // Set both coordinate systems for backward compatibility
      const treeData = {
        ...data,
        latitude: data.lat,
        longitude: data.lng,
      };
      
      await onSubmit(treeData);
    } catch (error) {
      console.error('Error submitting tree form:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{tree ? 'Edit Tree' : 'Add New Tree'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tree_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tree Number</FormLabel>
                    <FormControl>
                      <Input placeholder="TR-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="species_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingSpecies ? "Loading..." : "Select species"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {species.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.scientific_name}
                            {s.common_names && s.common_names.length > 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({s.common_names[0]})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location</h3>
              <TreeLocationSection
                initialLat={form.watch('lat')}
                initialLng={form.watch('lng')}
                onLatLngChange={(lat, lng) => {
                  form.setValue('lat', lat);
                  form.setValue('lng', lng);
                  form.setValue('latitude', lat);
                  form.setValue('longitude', lng);
                }}
              />
            </div>

            {/* Measurements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dbh_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DBH (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1500"
                        placeholder="45"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (m)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="120"
                        placeholder="15"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crown_spread_m"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crown Spread (m)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="8"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age_estimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Estimate (years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="25"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownership"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership</FormLabel>
                    <FormControl>
                      <Input placeholder="Municipality, Private, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Next to building entrance, in park center, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Soil type, drainage, urban environment factors, etc."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional observations, historical information, etc."
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="protected_status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Protected Status</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This tree has legal protection or heritage status
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : tree ? 'Update Tree' : 'Add Tree'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}