create or replace function public.move_folder(
  p_folder_id uuid,
  p_new_parent_folder_id uuid,
  p_workspace_id uuid
)
returns void
language plpgsql
as $$
declare
  v_folder_id uuid;
  v_old_path text;
  v_old_depth integer;
  v_folder_workspace_id uuid;
  v_parent_path text;
  v_parent_depth integer;
  v_parent_workspace_id uuid;
  v_parent_is_trashed boolean;
  v_new_path text;
  v_new_depth integer;
begin
  perform id from public.folders
  where id in (p_folder_id, p_new_parent_folder_id)
  order by id
  for update;

  select id, coalesce(path, id::text), depth, workspace_id
    into v_folder_id, v_old_path, v_old_depth, v_folder_workspace_id
  from public.folders
  where id = p_folder_id;

  if not found or v_folder_workspace_id <> p_workspace_id then
    raise exception 'Folder not found in this workspace.';
  end if;

  if p_new_parent_folder_id is not null then
    select coalesce(path, id::text), depth, workspace_id, is_trashed
      into v_parent_path, v_parent_depth, v_parent_workspace_id, v_parent_is_trashed
    from public.folders
    where id = p_new_parent_folder_id;

    if not found
      or v_parent_workspace_id <> p_workspace_id
      or v_parent_is_trashed then
      raise exception 'Target folder is unavailable.';
    end if;

    if p_new_parent_folder_id = p_folder_id then
      raise exception 'Cannot move a folder into itself.';
    end if;

    if v_parent_path = v_old_path
      or v_parent_path like v_old_path || '/%' then
      raise exception 'Cannot move a folder into one of its descendants.';
    end if;

    v_new_path := v_parent_path || '/' || p_folder_id::text;
    v_new_depth := v_parent_depth + 1;
  else
    v_new_path := p_folder_id::text;
    v_new_depth := 0;
  end if;

  update public.folders
  set path = v_new_path,
      depth = v_new_depth,
      parent_folder_id = p_new_parent_folder_id,
      updated_at = now()
  where id = p_folder_id
    and workspace_id = p_workspace_id;

  update public.folders
  set path = v_new_path || substring(path from length(v_old_path) + 1),
      depth = depth + (v_new_depth - v_old_depth),
      updated_at = now()
  where workspace_id = p_workspace_id
    and path like v_old_path || '/%';
end;
$$;

create or replace function public.cascade_trash_folder(
  p_folder_id uuid,
  p_workspace_id uuid
)
returns void
language plpgsql
as $$
declare
  v_folder_path text;
  v_folder_workspace_id uuid;
begin
  select coalesce(path, id::text), workspace_id
    into v_folder_path, v_folder_workspace_id
  from public.folders
  where id = p_folder_id;

  if not found or v_folder_workspace_id <> p_workspace_id then
    raise exception 'Folder not found in this workspace.';
  end if;

  update public.folders
  set is_trashed = true,
      trashed_at = now()
  where workspace_id = p_workspace_id
    and is_trashed = false
    and (id = p_folder_id or coalesce(path, id::text) like v_folder_path || '/%');

  update public.files
  set is_trashed = true,
      trashed_at = now()
  where workspace_id = p_workspace_id
    and is_trashed = false
    and folder_id in (
      select id
      from public.folders
      where workspace_id = p_workspace_id
        and (id = p_folder_id or coalesce(path, id::text) like v_folder_path || '/%')
    );
end;
$$;

create or replace function public.cascade_restore_folder(
  p_folder_id uuid,
  p_workspace_id uuid
)
returns void
language plpgsql
as $$
declare
  v_folder_path text;
  v_folder_workspace_id uuid;
  v_trashed_at timestamptz;
begin
  select coalesce(path, id::text), workspace_id, trashed_at
    into v_folder_path, v_folder_workspace_id, v_trashed_at
  from public.folders
  where id = p_folder_id;

  if not found or v_folder_workspace_id <> p_workspace_id then
    raise exception 'Folder not found in this workspace.';
  end if;

  update public.folders
  set is_trashed = false,
      trashed_at = null
  where workspace_id = p_workspace_id
    and (
      v_folder_path like coalesce(path, id::text) || '/%'
      or (
        (id = p_folder_id or coalesce(path, id::text) like v_folder_path || '/%')
        and trashed_at = v_trashed_at
      )
    );

  update public.files
  set is_trashed = false,
      trashed_at = null
  where workspace_id = p_workspace_id
    and trashed_at = v_trashed_at
    and folder_id in (
      select id
      from public.folders
      where workspace_id = p_workspace_id
        and (id = p_folder_id or coalesce(path, id::text) like v_folder_path || '/%')
    );
end;
$$;
