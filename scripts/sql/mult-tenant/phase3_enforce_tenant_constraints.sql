-- Fase 3 multi-tenant (task 4.0): torna tenant_id NOT NULL, reforça FKs
-- com ON DELETE RESTRICT e converte chaves únicas para incluir tenant_id.
-- Idempotente e tolerante a tabelas ausentes; deve ser executado após:
--   1) phase1_add_tenant_id.sql
--   2) phase2_backfill_tenant_id.sql
-- Requer que todas as linhas já tenham tenant_id preenchido.

------------------------------
-- 1) NOT NULL + FK restritiva
------------------------------
DO $$
DECLARE
  target text[];
  targets constant text[][] := ARRAY[
    ['public', 'processos'],
    ['public', 'pessoas'],
    ['public', 'Publicacao'],
    ['public', 'Prazo'],
    ['public', 'Andamento'],
    ['public', 'upload_Documentos'],
    ['public', 'Modelos_Peticao'],
    ['public', 'Historico_Peticoes'],
    ['public', 'situacoes'],
    ['public', 'comarcas'],
    ['public', 'varas'],
    ['public', 'tribunais'],
    ['public', 'instancias'],
    ['public', 'tipos_acao'],
    ['public', 'ritos'],
    ['public', 'fases'],
    ['public', 'moedas'],
    ['public', 'probabilidades'],
    ['public', 'TipoAndamento'],
    ['public', 'decisoes'],
    ['public', 'esferas'],
    ['public', 'sj_papelcliente']
  ];
  tbl regclass;
  is_nullable boolean;
  fk_soft text;
  fk_hard text;
BEGIN
  FOREACH target SLICE 1 IN ARRAY targets LOOP
    tbl := to_regclass(format('%I.%I', target[1], target[2]));
    IF tbl IS NULL THEN
      RAISE NOTICE 'Tabela %.% não encontrada; ignorando.', target[1], target[2];
      CONTINUE;
    END IF;

    SELECT (c.is_nullable = 'YES')
      INTO is_nullable
      FROM information_schema.columns c
      WHERE c.table_schema = target[1]
        AND c.table_name = target[2]
        AND c.column_name = 'tenant_id';

    IF is_nullable THEN
      EXECUTE format('ALTER TABLE %s ALTER COLUMN tenant_id SET NOT NULL', tbl);
      RAISE NOTICE 'Tabela %.%: coluna tenant_id marcada como NOT NULL.', target[1], target[2];
    ELSE
      RAISE NOTICE 'Tabela %.%: coluna tenant_id já é NOT NULL.', target[1], target[2];
    END IF;

    fk_soft := target[2] || '_tenant_id_fkey_soft';
    fk_hard := target[2] || '_tenant_id_fkey';

    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', tbl, fk_soft);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint pc
      JOIN pg_class c ON pc.conrelid = c.oid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pc.contype = 'f'
        AND n.nspname = target[1]
        AND c.relname = target[2]
        AND pc.conname = fk_hard
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT',
        tbl,
        fk_hard
      );
      RAISE NOTICE 'Tabela %.%: FK restritiva criada (%).', target[1], target[2], fk_hard;
    ELSE
      RAISE NOTICE 'Tabela %.%: FK restritiva já existe (%).', target[1], target[2], fk_hard;
    END IF;
  END LOOP;
END;
$$;

------------------------------------------------------------
-- 2) Converter UNIQUE constraints para incluir tenant_id
--    (apenas constraints baseadas em colunas, sem expressões)
------------------------------------------------------------
DO $$
DECLARE
  rec record;
  cols text;
  has_tenant boolean;
  new_name text;
  target_tables constant text[] := ARRAY[
    'users',              -- já possuía tenant_id; garantir unicidade por tenant
    'processos',
    'pessoas',
    'Publicacao',
    'Prazo',
    'Andamento',
    'upload_Documentos',
    'Modelos_Peticao',
    'Historico_Peticoes',
    'situacoes',
    'comarcas',
    'varas',
    'tribunais',
    'instancias',
    'tipos_acao',
    'ritos',
    'fases',
    'moedas',
    'probabilidades',
    'TipoAndamento',
    'decisoes',
    'esferas',
    'sj_papelcliente'
  ];
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      cls.relname AS table_name,
      con.conname AS constraint_name,
      con.conrelid,
      con.conkey
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    WHERE con.contype = 'u'
      AND n.nspname = 'public'
      AND cls.relname = ANY(target_tables)
  LOOP
    has_tenant := EXISTS (
      SELECT 1
      FROM unnest(rec.conkey) AS u(attnum)
      JOIN pg_attribute a ON a.attrelid = rec.conrelid AND a.attnum = u.attnum
      WHERE a.attname = 'tenant_id'
    );

    IF has_tenant THEN
      RAISE NOTICE 'Constraint % já inclui tenant_id; ignorando.', rec.constraint_name;
      CONTINUE;
    END IF;

    cols := array_to_string(
      ARRAY(
        SELECT quote_ident(a.attname)
        FROM unnest(rec.conkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = rec.conrelid AND a.attnum = k.attnum
        ORDER BY k.ord
      ),
      ', '
    );

    IF cols IS NULL OR cols = '' THEN
      RAISE NOTICE 'Constraint % parece não ser baseada apenas em colunas; ignorando.', rec.constraint_name;
      CONTINUE;
    END IF;

    new_name := left(rec.constraint_name || '_tenant', 63);

    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
      rec.schema_name,
      rec.table_name,
      rec.constraint_name
    );

    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I UNIQUE (tenant_id, %s)',
      rec.schema_name,
      rec.table_name,
      new_name,
      cols
    );

    RAISE NOTICE 'Constraint % -> % recriada com tenant_id.', rec.constraint_name, new_name;
  END LOOP;
END;
$$;

------------------------------------------------------------------
-- 3) Converter UNIQUE indexes (sem constraint) para incluir tenant
--    cobre casos com expressões, p.ex. lower(email)
------------------------------------------------------------------
DO $$
DECLARE
  rec record;
  cols text;
  new_name text;
  definition text;
  target_tables constant text[] := ARRAY[
    'users',
    'processos',
    'pessoas',
    'Publicacao',
    'Prazo',
    'Andamento',
    'upload_Documentos',
    'Modelos_Peticao',
    'Historico_Peticoes',
    'situacoes',
    'comarcas',
    'varas',
    'tribunais',
    'instancias',
    'tipos_acao',
    'ritos',
    'fases',
    'moedas',
    'probabilidades',
    'TipoAndamento',
    'decisoes',
    'esferas',
    'sj_papelcliente'
  ];
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      t.relname AS table_name,
      idx.relname AS index_name,
      i.indexrelid,
      i.indkey,
      i.indnatts
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE i.indisunique
      AND NOT i.indisprimary
      AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
      AND n.nspname = 'public'
      AND t.relname = ANY(target_tables)
  LOOP
    definition := pg_get_indexdef(rec.indexrelid);
    IF position('tenant_id' IN lower(definition)) > 0 THEN
      RAISE NOTICE 'Índice % já inclui tenant_id; ignorando.', rec.index_name;
      CONTINUE;
    END IF;

    cols := array_to_string(
      ARRAY(
        SELECT pg_get_indexdef(rec.indexrelid, pos, true)
        FROM generate_series(1, rec.indnatts) AS pos
      ),
      ', '
    );

    IF cols IS NULL OR cols = '' THEN
      RAISE NOTICE 'Índice % sem colunas legíveis; ignorando.', rec.index_name;
      CONTINUE;
    END IF;

    new_name := left(rec.index_name || '_tenant', 63);

    EXECUTE format('DROP INDEX IF EXISTS %I.%I', rec.schema_name, rec.index_name);
    EXECUTE format(
      'CREATE UNIQUE INDEX %I ON %I.%I (tenant_id, %s)',
      new_name,
      rec.schema_name,
      rec.table_name,
      cols
    );

    RAISE NOTICE 'Índice % -> % recriado com tenant_id.', rec.index_name, new_name;
  END LOOP;
END;
$$;

-- Validações rápidas pós-execução:
-- 1) NULLs restantes (deve retornar 0 linhas por tabela):
--    Para cada tabela afetada: SELECT count(*) FROM public.<tabela> WHERE tenant_id IS NULL;
--
-- 2) Conferir FKs restritivas:
--    SELECT conname, relname FROM pg_constraint pc
--    JOIN pg_class c ON pc.conrelid = c.oid
--    WHERE conname LIKE '%_tenant_id_fkey';
--
-- 3) Conferir uniques contendo tenant_id:
--    SELECT i.relname, pg_get_indexdef(i.oid)
--    FROM pg_class i
--    JOIN pg_index ix ON ix.indexrelid = i.oid
--    WHERE ix.indisunique AND pg_get_indexdef(i.oid) ILIKE '%tenant_id%';

