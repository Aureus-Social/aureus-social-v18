-- ÉTAPE 1 : Voir toutes les tables existantes et leurs colonnes
-- Colle ce SQL en premier pour voir ce qui existe

SELECT 
  t.table_name,
  array_agg(c.column_name ORDER BY c.ordinal_position) as colonnes
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;
