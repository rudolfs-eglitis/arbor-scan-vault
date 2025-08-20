import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Tree {
  id: string;
  tree_number?: string;
  species_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  dbh_cm?: number;
  height_m?: number;
  crown_spread_m?: number;
  age_estimate?: number;
  location_description?: string;
  site_conditions?: string;
  ownership?: string;
  protected_status: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  species?: {
    id: string;
    scientific_name: string;
    common_names?: string[];
  };
}

export interface Assessment {
  id: string;
  tree_id: string;
  assessment_date: string;
  assessor_id: string;
  assessment_method: string;
  weather_conditions?: string;
  overall_condition?: string;
  probability_of_failure?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  consequence_rating?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  risk_rating?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  recommendations?: string;
  follow_up_date?: string;
  status: 'draft' | 'completed' | 'reviewed' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
  tree?: Tree;
}

export interface TreeDefect {
  id: string;
  assessment_id: string;
  defect_id: string;
  location_on_tree?: string;
  severity_rating?: number;
  extent_percentage?: number;
  description?: string;
  affects_structure: boolean;
  defect?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface TreeTarget {
  id: string;
  assessment_id: string;
  target_type: 'people' | 'property' | 'infrastructure' | 'vehicle' | 'other';
  description?: string;
  distance_m?: number;
  occupancy_frequency?: string;
  value_rating?: number;
}

export interface TreePhoto {
  id: string;
  assessment_id?: string;
  tree_id: string;
  file_path: string;
  caption?: string;
  photo_type?: string;
  taken_at: string;
  uploaded_by?: string;
}

export function useTreeAssessment() {
  const { user } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrees = async () => {
    try {
      const { data, error } = await supabase
        .from('trees')
        .select(`
          *,
          species (
            id,
            scientific_name,
            common_names
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrees(data || []);
    } catch (error) {
      console.error('Error fetching trees:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          *,
          tree:trees (
            *,
            species (
              id,
              scientific_name,
              common_names
            )
          )
        `)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const createTree = async (treeData: Omit<Partial<Tree>, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'species'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trees')
      .insert([{
        ...treeData,
        created_by: user.id,
      }])
      .select(`
        *,
        species (
          id,
          scientific_name,
          common_names
        )
      `)
      .single();

    if (error) throw error;
    
    setTrees(prev => [data, ...prev]);
    return data;
  };

  const updateTree = async (id: string, updates: Partial<Tree>) => {
    const { data, error } = await supabase
      .from('trees')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        species (
          id,
          scientific_name,
          common_names
        )
      `)
      .single();

    if (error) throw error;
    
    setTrees(prev => prev.map(tree => tree.id === id ? data : tree));
    return data;
  };

  const deleteTree = async (id: string) => {
    const { error } = await supabase
      .from('trees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setTrees(prev => prev.filter(tree => tree.id !== id));
  };

  const createAssessment = async (assessmentData: Partial<Assessment>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('assessments')
      .insert([{
        ...assessmentData,
        assessor_id: user.id,
      }])
      .select(`
        *,
        tree:trees (
          *,
          species (
            id,
            scientific_name,
            common_names
          )
        )
      `)
      .single();

    if (error) throw error;
    
    setAssessments(prev => [data, ...prev]);
    return data;
  };

  const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
    const { data, error } = await supabase
      .from('assessments')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        tree:trees (
          *,
          species (
            id,
            scientific_name,
            common_names
          )
        )
      `)
      .single();

    if (error) throw error;
    
    setAssessments(prev => prev.map(assessment => assessment.id === id ? data : assessment));
    return data;
  };

  const fetchTreeDefects = async (assessmentId: string): Promise<TreeDefect[]> => {
    const { data, error } = await supabase
      .from('tree_defects')
      .select(`
        *,
        defect:defects (
          id,
          name,
          category
        )
      `)
      .eq('assessment_id', assessmentId);

    if (error) throw error;
    return data || [];
  };

  const createTreeDefect = async (defectData: Partial<TreeDefect>) => {
    const { data, error } = await supabase
      .from('tree_defects')
      .insert([defectData])
      .select(`
        *,
        defect:defects (
          id,
          name,
          category
        )
      `)
      .single();

    if (error) throw error;
    return data;
  };

  const fetchTreeTargets = async (assessmentId: string): Promise<TreeTarget[]> => {
    const { data, error } = await supabase
      .from('tree_targets')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) throw error;
    return data || [];
  };

  const createTreeTarget = async (targetData: Omit<TreeTarget, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('tree_targets')
      .insert([targetData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const fetchTreePhotos = async (treeId: string): Promise<TreePhoto[]> => {
    const { data, error } = await supabase
      .from('tree_photos')
      .select('*')
      .eq('tree_id', treeId)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const uploadTreePhoto = async (file: File, treeId: string, assessmentId?: string, caption?: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${treeId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tree-photos')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create database record
    const { data, error } = await supabase
      .from('tree_photos')
      .insert([{
        tree_id: treeId,
        assessment_id: assessmentId,
        file_path: fileName,
        caption,
        uploaded_by: user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([fetchTrees(), fetchAssessments()]);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  return {
    trees,
    assessments,
    loading,
    createTree,
    updateTree,
    deleteTree,
    createAssessment,
    updateAssessment,
    fetchTreeDefects,
    createTreeDefect,
    fetchTreeTargets,
    createTreeTarget,
    fetchTreePhotos,
    uploadTreePhoto,
    refreshData: () => Promise.all([fetchTrees(), fetchAssessments()]),
  };
}