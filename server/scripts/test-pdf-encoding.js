#!/usr/bin/env node

/**
 * Script de test pour valider l'encodage UTF-8 dans les PDF générés
 * Teste tous les caractères spéciaux français
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_URL = 'http://localhost:8787';

// Données de test avec TOUS les caractères accentués français
const testData = {
  url: 'https://exemple-test-encodage.fr',
  title: 'Test d\'encodage UTF-8 : àâäéèêëïîôùûüÿçœæ',
  summary: `Ce résumé teste l'encodage UTF-8 avec tous les accents français.

Voyelles accentuées :
- À, Â, Ä : Majuscules avec accents graves, circonflexes et trémas
- à, â, ä : minuscules avec accents
- É, È, Ê, Ë : majuscules E avec accents
- é, è, ê, ë : minuscules e avec accents
- Î, Ï : majuscules I avec accents
- î, ï : minuscules i avec accents
- Ô, Ö : majuscules O avec accents
- ô, ö : minuscules o avec accents
- Ù, Û, Ü : majuscules U avec accents
- ù, û, ü : minuscules u avec accents
- Ÿ, ÿ : Y avec tréma

Caractères spéciaux :
- Ç, ç : C cédille majuscule et minuscule
- Œ, œ : E dans l'O (œuvre, cœur)
- Æ, æ : A et E liés

Symboles courants :
- « Guillemets français »
- … Points de suspension
- – Tiret demi-cadratin
- — Tiret cadratin
- € Euro
- ° Degré

Phrases d'exemple :
"L'été dernier, j'ai visité Québec avec ma sœur Ève."
"Les élèves étudient l'œuvre de Molière : « Le Malade imaginaire »."
"La température était de 25°C, idéale pour flâner."
"Le café coûte 3,50€ au café-théâtre."`,

  checklist: [
    'Vérifier que les accents graves (à, è, ù) s\'affichent correctement',
    'Tester les accents aigus (é) et circonflexes (â, ê, î, ô, û)',
    'Valider les trémas (ë, ï, ü, ÿ) et la cédille (ç)',
    'Contrôler les ligatures œ et æ (œuvre, æquo)',
    'S\'assurer que les guillemets « français » fonctionnent',
    'Vérifier les symboles € et ° (degré)'
  ],

  common_errors: [
    'Erreur classique : "Ã©" au lieu de "é" → problème d\'encodage UTF-8',
    'Attention : "Ã " au lieu de "à" → vérifier Content-Type: charset=utf-8',
    'Piège : "Ã´" au lieu de "ô" → utiliser une police Unicode (Roboto, Arial)'
  ],

  faqs: [
    {
      question: 'Pourquoi les accents s\'affichent mal (Ã©, Ã , etc.) ?',
      answer: 'C\'est un problème d\'encodage. Le fichier est en UTF-8 mais le PDF utilise une police qui ne supporte pas l\'Unicode. Solution : utiliser une police TrueType Unicode comme Roboto ou DejaVu.'
    },
    {
      question: 'Comment gérer les caractères spéciaux (œ, æ, €) ?',
      answer: 'Ces caractères nécessitent une police Unicode complète. Roboto, Open Sans ou Arial Unicode MS supportent tous ces caractères. Il faut enregistrer la police avec doc.registerFont() dans PDFKit.'
    },
    {
      question: 'Les guillemets français « » ne s\'affichent pas ?',
      answer: 'Les guillemets français (U+00AB et U+00BB) sont des caractères Unicode. Assurez-vous que votre police les supporte. Roboto et la plupart des polices Google Fonts les incluent.'
    }
  ]
};

async function testPDFGeneration() {
  console.log('🧪 Test de génération PDF avec encodage UTF-8\n');
  console.log('📝 Données de test :');
  console.log(`   - Titre : ${testData.title}`);
  console.log(`   - Résumé : ${testData.summary.substring(0, 80)}...`);
  console.log(`   - Checklist : ${testData.checklist.length} items`);
  console.log(`   - Erreurs : ${testData.common_errors.length} items`);
  console.log(`   - FAQ : ${testData.faqs.length} items\n`);

  try {
    console.log(`🔗 Appel API : POST ${SERVER_URL}/export/pdf\n`);

    const response = await fetch(`${SERVER_URL}/export/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur API (${response.status}): ${error.message || error.error}`);
    }

    // Récupérer le PDF en tant que buffer
    const buffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(buffer);

    // Sauvegarder le PDF
    const outputPath = path.join(__dirname, '..', 'test-encoding-utf8.pdf');
    await fs.writeFile(outputPath, pdfBuffer);

    console.log('✅ PDF généré avec succès !');
    console.log(`📄 Fichier : ${outputPath}`);
    console.log(`📦 Taille : ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    console.log('🔍 Vérifications à faire manuellement :');
    console.log('   1. Ouvrir le PDF : test-encoding-utf8.pdf');
    console.log('   2. Vérifier que les accents sont corrects (é, è, à, ç, etc.)');
    console.log('   3. Vérifier les caractères spéciaux (œ, æ, €, °)');
    console.log('   4. Vérifier les guillemets français « »');
    console.log('   5. Comparer avec le résumé original ci-dessus\n');

    console.log('✨ Si tous les caractères s\'affichent correctement, l\'encodage UTF-8 fonctionne !\n');

  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
    console.error('\n💡 Solutions possibles :');
    console.error('   1. Vérifier que le serveur est démarré (npm run dev)');
    console.error('   2. Vérifier que les polices Roboto sont dans server/fonts/');
    console.error('   3. Vérifier que pdfkit est installé (npm install pdfkit)');
    console.error('   4. Vérifier les logs du serveur pour plus de détails\n');
    process.exit(1);
  }
}

// Exécution
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  Test d\'Encodage UTF-8 - Génération PDF          ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

testPDFGeneration();
