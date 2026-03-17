-- Audit données sensibles en clair (à exécuter pour vérifier l'état)
-- Montre combien d'employés ont encore NISS/IBAN en clair

SELECT 
  user_id,
  count(*) as nb_employes,
  count(*) FILTER (WHERE niss IS NOT NULL AND niss NOT LIKE 'enc:%') as niss_en_clair,
  count(*) FILTER (WHERE iban IS NOT NULL AND iban NOT LIKE 'enc:%') as iban_en_clair,
  count(*) FILTER (WHERE niss LIKE 'enc:%') as niss_chiffre,
  count(*) FILTER (WHERE iban LIKE 'enc:%') as iban_chiffre
FROM employes
GROUP BY user_id
ORDER BY niss_en_clair DESC;
