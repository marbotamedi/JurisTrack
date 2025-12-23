-- Fase 1 multi-tenant: adiciona tenant_id nullable + FK branda + indice
-- Idempotente: ignora tabelas ausentes, preserva constraint se ja existir.
-- Executar no Supabase; nao altera constraints unicas nesta fase.

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
    ['public', 'sj_papelcliente'],
  ];
  tbl regclass;
  fk_name text;
  idx_name text;
BEGIN
  FOREACH target SLICE 1 IN ARRAY targets LOOP
    tbl := to_regclass(format('%I.%I', target[1], target[2]));
    IF tbl IS NULL THEN
      RAISE NOTICE 'Tabela %.% nao encontrada; ignorando nesta fase.', target[1], target[2];
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %s ADD COLUMN IF NOT EXISTS tenant_id uuid', tbl);

    fk_name := target[2] || '_tenant_id_fkey_soft';
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint pc
      JOIN pg_class c ON pc.conrelid = c.oid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pc.contype = 'f'
        AND n.nspname = target[1]
        AND c.relname = target[2]
        AND pc.conname = fk_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL',
        tbl,
        fk_name
      );
    ELSE
      RAISE NOTICE 'FK % ja existe em %.%; mantendo.', fk_name, target[1], target[2];
    END IF;

    idx_name := target[2] || '_tenant_id_idx';
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (tenant_id)', idx_name, tbl);
  END LOOP;
END;
$$;

-- Validacoes rapidas pos-aplicacao:
-- 1) Colunas: select table_name, column_name from information_schema.columns where column_name = 'tenant_id' and table_schema = 'public';
-- 2) FKs brandas: select conname, relname from pg_constraint pc join pg_class c on pc.conrelid = c.oid where conname like '%tenant_id_fkey_soft';
-- 3) Indices: select tablename, indexname from pg_indexes where indexname like '%tenant_id_idx';

