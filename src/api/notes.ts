import { z } from 'zod';

/**
 * Note entity schema with validation
 */
export const NoteSchema = z.object({
  id: z.string().uuid('Note ID must be a valid UUID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  content: z.string().max(10000, 'Content must not exceed 10000 characters'),
  category: z.string().min(1, 'Category is required').max(50, 'Category must not exceed 50 characters'),
  tags: z.array(z.string().max(30)).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  mood: z.enum(['calm', 'inspired', 'reflective', 'grateful', 'neutral']).optional(),
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * Request schemas for API operations
 */
export const CreateNoteRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must not exceed 255 characters'),
  content: z.string().max(10000, 'Content must not exceed 10000 characters'),
  category: z.string().min(1, 'Category is required').max(50, 'Category must not exceed 50 characters'),
  tags: z.array(z.string().max(30)).optional().default([]),
  mood: z.enum(['calm', 'inspired', 'reflective', 'grateful', 'neutral']).optional(),
});

export type CreateNoteRequest = z.infer<typeof CreateNoteRequestSchema>;

export const ReadNotesByCategoryRequestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.number().int().positive().optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ReadNotesByCategoryRequest = z.infer<typeof ReadNotesByCategoryRequestSchema>;

/**
 * Response schemas for API operations
 */
export const CreateNoteResponseSchema = z.object({
  status: z.literal('success'),
  data: NoteSchema,
});

export type CreateNoteResponse = z.infer<typeof CreateNoteResponseSchema>;

export const ReadNotesByCategoryResponseSchema = z.object({
  status: z.literal('success'),
  data: z.object({
    notes: z.array(NoteSchema),
    total: z.number().int().nonnegative(),
    category: z.string(),
  }),
});

export type ReadNotesByCategoryResponse = z.infer<typeof ReadNotesByCategoryResponseSchema>;

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * In-memory store for notes
 * Stores notes in a Map by category for efficient lookups
 */
class NotesStore {
  private notes: Map<string, Note[]> = new Map();
  private notesById: Map<string, Note> = new Map();

  /**
   * Generate UUID v4
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Create a new note
   */
  createNote(request: CreateNoteRequest): Note {
    const id = this.generateId();
    const now = new Date();

    const note: Note = {
      id,
      title: request.title,
      content: request.content,
      category: request.category,
      tags: request.tags || [],
      createdAt: now,
      updatedAt: now,
      mood: request.mood,
    };

    // Validate note against schema
    const validated = NoteSchema.parse(note);

    // Store by ID for fast lookup
    this.notesById.set(id, validated);

    // Store by category
    if (!this.notes.has(request.category)) {
      this.notes.set(request.category, []);
    }
    this.notes.get(request.category)!.push(validated);

    return validated;
  }

  /**
   * Read notes by category with pagination
   */
  readNotesByCategory(
    category: string,
    options: { limit?: number; offset?: number } = {}
  ): { notes: Note[]; total: number } {
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    const categoryNotes = this.notes.get(category) || [];
    const total = categoryNotes.length;

    // Sort by createdAt descending (newest first)
    const sorted = [...categoryNotes].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const paginated = sorted.slice(offset, offset + limit);

    return {
      notes: paginated,
      total,
    };
  }

  /**
   * Get a note by ID
   */
  getNoteById(id: string): Note | null {
    return this.notesById.get(id) || null;
  }

  /**
   * Get all categories with note count
   */
  getCategories(): Array<{ name: string; count: number }> {
    return Array.from(this.notes.entries()).map(([name, notes]) => ({
      name,
      count: notes.length,
    }));
  }

  /**
   * Delete a note by ID
   */
  deleteNote(id: string): boolean {
    const note = this.notesById.get(id);
    if (!note) return false;

    // Remove from ID map
    this.notesById.delete(id);

    // Remove from category list
    const categoryNotes = this.notes.get(note.category);
    if (categoryNotes) {
      const index = categoryNotes.findIndex((n) => n.id === id);
      if (index >= 0) {
        categoryNotes.splice(index, 1);
      }
      // Clean up empty categories
      if (categoryNotes.length === 0) {
        this.notes.delete(note.category);
      }
    }

    return true;
  }

  /**
   * Clear all notes (for testing)
   */
  clear(): void {
    this.notes.clear();
    this.notesById.clear();
  }
}

// Singleton instance
const store = new NotesStore();

/**
 * API: Create a new note
 * @param request - CreateNoteRequest with title, content, category, and optional tags/mood
 * @returns Note with assigned ID and timestamps
 * @throws Error if validation fails
 */
export function createNote(request: CreateNoteRequest): CreateNoteResponse {
  try {
    // Validate request
    const validated = CreateNoteRequestSchema.parse(request);
    const note = store.createNote(validated);

    return {
      status: 'success',
      data: note,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join('; ')}`);
    }
    throw error;
  }
}

/**
 * API: Read notes by category
 * @param category - Category name to filter by
 * @param options - Optional limit and offset for pagination
 * @returns Array of notes in the category with total count
 * @throws Error if validation fails
 */
export function readNotesByCategory(
  category: string,
  options?: { limit?: number; offset?: number }
): ReadNotesByCategoryResponse {
  try {
    // Validate request
    const validated = ReadNotesByCategoryRequestSchema.parse({
      category,
      ...options,
    });

    const { notes, total } = store.readNotesByCategory(validated.category, {
      limit: validated.limit,
      offset: validated.offset,
    });

    return {
      status: 'success',
      data: {
        notes,
        total,
        category: validated.category,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join('; ')}`);
    }
    throw error;
  }
}

/**
 * API: Get a note by ID
 * @param id - Note ID
 * @returns Note or null if not found
 */
export function getNoteById(id: string): Note | null {
  return store.getNoteById(id);
}

/**
 * API: Get all categories
 * @returns Array of categories with note counts
 */
export function getCategories(): Array<{ name: string; count: number }> {
  return store.getCategories();
}

/**
 * API: Delete a note
 * @param id - Note ID to delete
 * @returns True if deleted, false if not found
 */
export function deleteNote(id: string): boolean {
  return store.deleteNote(id);
}

/**
 * Utility: Clear all notes (for testing/reset)
 */
export function clearAllNotes(): void {
  store.clear();
}
