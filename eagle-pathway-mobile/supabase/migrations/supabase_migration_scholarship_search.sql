-- Better scholarship discovery.
--
-- Adds database-side full-text/trigram search so searches like
-- "engineering scholarships UK" can match descriptions, organizations,
-- countries, and fields of study instead of only exact scholarship names.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_scholarships_search_tsv
ON public.scholarships
USING GIN (
  to_tsvector(
    'english',
    COALESCE(name, '') || ' ' ||
    COALESCE(organization, '') || ' ' ||
    COALESCE(country, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(array_to_string(fields_of_study, ' '), '') || ' ' ||
    COALESCE(array_to_string(requirements, ' '), '')
  )
);

CREATE INDEX IF NOT EXISTS idx_scholarships_name_trgm
ON public.scholarships
USING GIN (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_scholarships(
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF public.scholarships
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.scholarships s
  WHERE s.is_active = TRUE
    AND (
      NULLIF(TRIM(p_query), '') IS NULL
      OR to_tsvector(
        'english',
        COALESCE(s.name, '') || ' ' ||
        COALESCE(s.organization, '') || ' ' ||
        COALESCE(s.country, '') || ' ' ||
        COALESCE(s.description, '') || ' ' ||
        COALESCE(array_to_string(s.fields_of_study, ' '), '') || ' ' ||
        COALESCE(array_to_string(s.requirements, ' '), '')
      ) @@ plainto_tsquery('english', p_query)
      OR s.name ILIKE '%' || p_query || '%'
      OR s.organization ILIKE '%' || p_query || '%'
      OR s.country ILIKE '%' || p_query || '%'
      OR s.description ILIKE '%' || p_query || '%'
      OR array_to_string(s.fields_of_study, ' ') ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE
      WHEN NULLIF(TRIM(p_query), '') IS NULL THEN 0
      ELSE ts_rank_cd(
        to_tsvector(
          'english',
          COALESCE(s.name, '') || ' ' ||
          COALESCE(s.organization, '') || ' ' ||
          COALESCE(s.country, '') || ' ' ||
          COALESCE(s.description, '') || ' ' ||
          COALESCE(array_to_string(s.fields_of_study, ' '), '') || ' ' ||
          COALESCE(array_to_string(s.requirements, ' '), '')
        ),
        plainto_tsquery('english', p_query)
      )
    END DESC,
    s.deadline ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.search_scholarships(TEXT, INTEGER) TO authenticated;
