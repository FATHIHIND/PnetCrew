/**
 * Script de diagnostic pour identifier les problèmes de chargement
 */

export async function runDiagnostic() {
  console.log('=== 🔍 DIAGNOSTIC SMARTTICKET ===');

  // Test 1 : XLSX disponible ?
  console.log('\n[Test 1] Bibliothèque XLSX :');
  if (typeof XLSX !== 'undefined') {
    console.log('✅ XLSX est chargé');
    console.log('Version XLSX:', XLSX.version);
  } else {
    console.error('❌ XLSX n\'est PAS chargé !');
    console.error('→ Vérifier que lib/xlsx.full.min.js existe');
    console.error('→ Vérifier que <script src="lib/xlsx.full.min.js"> est dans popup.html');
    return;
  }

  // Test 2 : Fichier Excel accessible ?
  console.log('\n[Test 2] Fichier Excel :');
  const fileUrl = chrome.runtime.getURL('data/tickets_seed.xlsx');
  console.log('URL générée:', fileUrl);

  try {
    const response = await fetch(fileUrl);
    console.log('Statut HTTP:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Fichier non accessible !');
      console.error('→ Vérifier que data/tickets_seed.xlsx existe');
      console.error('→ Vérifier web_accessible_resources dans manifest.json');
      return;
    }

    console.log('✅ Fichier accessible');

    const arrayBuffer = await response.arrayBuffer();
    console.log('Taille du fichier:', arrayBuffer.byteLength, 'octets');

    if (arrayBuffer.byteLength === 0) {
      console.error('❌ Fichier vide !');
      return;
    }

    console.log('✅ Fichier non vide');

    // Test 3 : Parser Excel
    console.log('\n[Test 3] Parsing Excel :');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log('✅ Workbook créé');
    console.log('Nombre de feuilles:', workbook.SheetNames.length);
    console.log('Noms des feuilles:', workbook.SheetNames);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    console.log('✅ Feuille sélectionnée:', sheetName);

    const json = XLSX.utils.sheet_to_json(sheet);
    console.log('✅ Conversion JSON réussie');
    console.log('Nombre de lignes:', json.length);

    if (json.length > 0) {
      console.log('Premier ticket:', json[0]);
      console.log('Colonnes détectées:', Object.keys(json[0]));
    } else {
      console.error('❌ Aucune donnée dans le fichier !');
    }

    console.log('\n=== ✅ DIAGNOSTIC TERMINÉ ===');
    return { success: true, tickets: json };

  } catch (error) {
    console.error('\n=== ❌ ERREUR DIAGNOSTIC ===');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error };
  }
}

// Auto-exécution si chargé directement
if (typeof window !== 'undefined') {
  window.runDiagnostic = runDiagnostic;
}
