-- Drop the existing 3-argument overload.
DROP FUNCTION public.match_files_by_embedding(vector, uuid, integer);

-- Recreate with the same body + a new shared_file_ids parameter.
-- The workspace predicate is widened so files matching EITHER the target
-- workspace OR any of the supplied shared file ids are eligible.
CREATE OR REPLACE FUNCTION public.match_files_by_embedding(
  query_embedding vector,
  target_workspace_id uuid,
  match_limit integer DEFAULT 5,
  shared_file_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  extension text,
  size bigint,
  created_at timestamp with time zone,
  storage_key text,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $function$
  SELECT
    f.id,
    f.name,
    f.type,
    f.extension,
    f.size,
    f.created_at,
    f.storage_key,
    1 - (am.embedding <=> query_embedding) AS similarity
  FROM files f
  JOIN ai_metadata am ON am.file_id = f.id
  WHERE (f.workspace_id = target_workspace_id OR f.id = ANY(shared_file_ids))
    AND f.is_trashed = false
    AND am.processing_status = 'completed'
    AND am.embedding IS NOT NULL
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_limit;
$function$;
