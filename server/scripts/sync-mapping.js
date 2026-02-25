/**
 * Script de synchronisation du mapping.json
 * Copie le mapping depuis server/data vers extension/
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, '..', 'data', 'mapping.json');
const TARGET = path.join(__dirname, '..', '..', 'extension', 'mapping.json');

async function syncMapping() {
  console.log('📋 Synchronisation du mapping...\n');
  console.log(`Source: ${SOURCE}`);
  console.log(`Cible:  ${TARGET}\n`);

  try {
    // Vérifier que la source existe
    await fs.access(SOURCE);

    // Lire le contenu
    const content = await fs.readFile(SOURCE, 'utf-8');
    const mapping = JSON.parse(content);

    console.log(`✓ Mapping chargé: ${mapping.length} entrée(s)`);

    // Écrire dans la cible
    await fs.writeFile(TARGET, JSON.stringify(mapping, null, 2), 'utf-8');

    console.log(`✓ Mapping copié vers l'extension`);
    console.log('\n✅ Synchronisation terminée avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la synchronisation:', error.message);
    process.exit(1);
  }
}

syncMapping();
