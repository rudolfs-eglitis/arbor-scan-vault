import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const sourceSchema = z.object({
  id: z.string().min(1, 'Source ID is required').regex(/^[a-z0-9_]+$/, 'ID must contain only lowercase letters, numbers, and underscores'),
  title: z.string().min(1, 'Title is required'),
  year: z.number().min(1000).max(new Date().getFullYear() + 1).optional(),
  lang: z.string().optional(),
  publisher: z.string().optional(),
  isbn: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  rights: z.string().optional(),
  notes: z.string().optional(),
  kind: z.enum(['book', 'standard', 'paper', 'web']).optional(),
});

type SourceFormData = z.infer<typeof sourceSchema>;

interface AddSourceFormProps {
  onSourceCreated: (sourceId: string) => void;
}

export const AddSourceForm = ({ onSourceCreated }: AddSourceFormProps) => {
  const [authors, setAuthors] = useState<string[]>([]);
  const [currentAuthor, setCurrentAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SourceFormData>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      kind: 'book',
      lang: 'en',
    },
  });

  const addAuthor = () => {
    if (currentAuthor.trim() && !authors.includes(currentAuthor.trim())) {
      setAuthors([...authors, currentAuthor.trim()]);
      setCurrentAuthor('');
    }
  };

  const removeAuthor = (author: string) => {
    setAuthors(authors.filter(a => a !== author));
  };

  const onSubmit = async (data: SourceFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('kb_sources')
        .insert({
          id: data.id,
          title: data.title,
          authors: authors.length > 0 ? authors : null,
          year: data.year || null,
          lang: data.lang,
          publisher: data.publisher,
          isbn: data.isbn,
          url: data.url || null,
          rights: data.rights,
          notes: data.notes,
          kind: data.kind,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Knowledge base source created successfully',
      });

      onSourceCreated(data.id);
    } catch (error) {
      console.error('Error creating source:', error);
      toast({
        title: 'Error',
        description: 'Failed to create source. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Knowledge Base Source</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., shigo_ne82_1986" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Book or document title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Authors</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Author name"
                  value={currentAuthor}
                  onChange={(e) => setCurrentAuthor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                />
                <Button type="button" onClick={addAuthor} variant="outline">
                  Add
                </Button>
              </div>
              {authors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {authors.map((author) => (
                    <Badge key={author} variant="secondary" className="flex items-center gap-1">
                      {author}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeAuthor(author)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2023"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lang"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sv">Swedish</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="paper">Paper</SelectItem>
                      <SelectItem value="web">Web Resource</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publisher</FormLabel>
                  <FormControl>
                    <Input placeholder="Publisher name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isbn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISBN</FormLabel>
                    <FormControl>
                      <Input placeholder="978-0-123456-78-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rights/License</FormLabel>
                  <FormControl>
                    <Input placeholder="Copyright information" {...field} />
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
                    <Textarea placeholder="Additional notes about this source" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creating Source...' : 'Create Source'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};