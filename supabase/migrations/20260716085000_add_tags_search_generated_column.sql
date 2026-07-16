-- Create an IMMUTABLE wrapper so it can be used in a generated column expression.
-- array_to_string is STABLE in Postgres, not IMMUTABLE, so a plain generated column
-- expression using it would be rejected. This wrapper declares IMMUTABLE which is
-- safe here because the function's output depends only on its inputs (no table reads,
-- no timezone lookups, etc.).
CREATE OR REPLACE FUNCTION public.immutable_array_to_string(arr text[], sep text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT array_to_string(arr, sep);
$$;

-- Add a STORED generated column to ai_metadata.
-- Postgres computes and stores the value on every INSERT/UPDATE of `tags`,
-- and backfills existing rows at ALTER TABLE time — no manual backfill needed.
-- Used exclusively for native ilike-based substring tag search in PostgREST,
-- so that filtering happens in the database before any row-cap applies.
-- No trigram/GIN index is added — consistent with the existing decision to use
-- exact/sequential scan for embeddings at small-to-medium dataset scale.
ALTER TABLE public.ai_metadata
  ADD COLUMN tags_search text
  GENERATED ALWAYS AS (public.immutable_array_to_string(tags, ' ')) STORED;
