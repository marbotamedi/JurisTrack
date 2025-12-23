-- Fase 2 multi-tenant: backfill idempotente de tenant_id com tenant padrão.
-- Execução segura: ignora tabelas ausentes, só atualiza linhas com tenant_id nulo,
-- registra contagens antes/depois e linhas afetadas. Reexecutar não altera dados válidos.
-- Ajuste o tenant padrão por ambiente via GUC `app.tenant_default` ou edite a constante abaixo.

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
  before_count bigint;
  after_count bigint;
  updated_count bigint;
  tenant_default uuid := COALESCE(
    NULLIF(current_setting('app.tenant_default', true), '')::uuid,
    '43f89b9e-7f0f-4ffc-87eb-4e5cf42a8597'  -- ajuste por ambiente se necessário
  );
BEGIN
  IF tenant_default IS NULL THEN
    RAISE EXCEPTION 'Tenant padrão não definido. Configure app.tenant_default ou edite a constante.';
  END IF;

  FOREACH target SLICE 1 IN ARRAY targets LOOP
    tbl := to_regclass(format('%I.%I', target[1], target[2]));
    IF tbl IS NULL THEN
      RAISE NOTICE 'Tabela %.% não encontrada; ignorando backfill.', target[1], target[2];
      CONTINUE;
    END IF;

    EXECUTE format('SELECT count(*) FROM %s WHERE tenant_id IS NULL', tbl) INTO before_count;

    IF before_count = 0 THEN
      RAISE NOTICE 'Tabela %.%: nada a preencher (0 linhas com tenant_id nulo).', target[1], target[2];
      CONTINUE;
    END IF;

    EXECUTE format('UPDATE %s SET tenant_id = $1 WHERE tenant_id IS NULL', tbl) USING tenant_default;
    GET DIAGNOSTICS updated_count = ROW_COUNT;

    EXECUTE format('SELECT count(*) FROM %s WHERE tenant_id IS NULL', tbl) INTO after_count;

    RAISE NOTICE 'Tabela %.%: antes=% linhas nulas, preenchidas=%, depois=% linhas nulas.',
      target[1], target[2], before_count, updated_count, after_count;

    IF after_count > 0 THEN
      RAISE WARNING 'Tabela %.% ainda tem % linhas com tenant_id nulo após backfill.', target[1], target[2], after_count;
    END IF;
  END LOOP;
END;
$$;

-- Validações pós-execução:
-- 1) Conferir contagens restantes (devem ser zero):
--    SELECT table_schema, table_name, count(*) AS null_rows
--    FROM information_schema.columns c
--    JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
--    JOIN LATERAL (
--      SELECT count(*) FROM pg_catalog.pg_class pc
--      WHERE pc.oid = (quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass
--    ) AS _ ON TRUE
--    WHERE c.column_name = 'tenant_id'
--      AND t.table_type = 'BASE TABLE'
--      AND c.table_schema = 'public'
--    GROUP BY table_schema, table_name
--    ORDER BY null_rows DESC;
--
-- 2) Para repetir o backfill, basta reexecutar este script (idempotente).


