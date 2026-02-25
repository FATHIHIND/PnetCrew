/**
 * Module d'intégration Azure AI Foundry (Azure OpenAI)
 * Génère des résumés, checklists et FAQ à partir de documents
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Configuration Azure OpenAI
const AZURE_CONFIG = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
  apiVersion: '2024-05-01-preview',
  timeout: 60000
};

/**
 * Extrait le texte d'un PDF (simplifié)
 * En production, utiliser pdf-parse ou autre bibliothèque
 */
async function extractTextFromPDF(pdfPath) {
  try {
    // Tentative d'utilisation de pdf-parse si disponible
    const pdfParse = await import('pdf-parse').catch(() => null);

    if (pdfParse) {
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    }

    // Fallback : simuler une extraction
    console.warn('[Azure] pdf-parse non disponible, utilisation de contenu simulé');
    return `[Contenu simulé du PDF: ${path.basename(pdfPath)}]\n\nCeci est un contenu de démonstration. En production, le texte serait extrait du PDF réel.`;
  } catch (error) {
    console.error('[Azure] Erreur extraction PDF:', error);
    throw new Error(`Impossible d'extraire le texte du PDF: ${error.message}`);
  }
}

/**
 * Construit le prompt pour Azure OpenAI
 */
function buildPrompt(documentText, key, isAutoSummary = false, url = null) {
  const contextDescription = isAutoSummary
    ? `PAGE WEB À ANALYSER (URL: ${url}):`
    : `DOCUMENT À ANALYSER (clé: ${key}):`;

  const specificInstructions = isAutoSummary
    ? `CONTEXTE: Cette page web a été visitée par l'utilisateur qui souhaite une aide contextuelle rapide.

OBJECTIF: Fournis une aide pratique et contextuelle basée sur le contenu de cette page.`
    : `CONTEXTE: Ceci est une documentation technique officielle.

OBJECTIF: Extrais les informations essentielles pour créer un guide de référence rapide.`;

  return `Tu es un assistant expert en analyse de contenu et documentation. Analyse le contenu suivant et fournis une réponse structurée en JSON.

${contextDescription}
${documentText.substring(0, 8000)} ${documentText.length > 8000 ? '...[tronqué]' : ''}

${specificInstructions}

INSTRUCTIONS:
Génère un objet JSON avec exactement cette structure:
{
  "summary": "Un résumé concis et informatif de 120-180 mots décrivant l'essentiel du contenu et son utilité",
  "checklist": [
    "Point d'action 1 - Action concrète que l'utilisateur peut faire sur cette page",
    "Point d'action 2 - Action concrète que l'utilisateur peut faire sur cette page",
    "Point d'action 3 - Action concrète que l'utilisateur peut faire sur cette page",
    "Point d'action 4 - Action concrète que l'utilisateur peut faire sur cette page",
    "Point d'action 5 - Action concrète que l'utilisateur peut faire sur cette page"
  ],
  "common_errors": [
    "Erreur fréquente 1 et comment l'éviter sur cette page",
    "Erreur fréquente 2 et comment l'éviter sur cette page",
    "Erreur fréquente 3 et comment l'éviter sur cette page"
  ],
  "faqs": [
    {"question": "Question fréquente 1 pertinente pour cette page?", "answer": "Réponse concise et pratique"},
    {"question": "Question fréquente 2 pertinente pour cette page?", "answer": "Réponse concise et pratique"},
    {"question": "Question fréquente 3 pertinente pour cette page?", "answer": "Réponse concise et pratique"}
  ]
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Tous les textes doivent être en français
- Sois précis, actionnable et pertinent pour le contexte de la page
- Concentre-toi sur les informations pratiques et utiles pour l'utilisateur
- Si le contenu est technique, adapte le langage pour être accessible`;
}

/**
 * Appelle l'API Azure OpenAI
 */
async function callAzureOpenAI(prompt) {
  // Vérifier la configuration
  if (!AZURE_CONFIG.endpoint || !AZURE_CONFIG.apiKey) {
    console.error('[Azure] Configuration manquante');
    throw new Error('Configuration Azure OpenAI manquante. Vérifiez les variables d\'environnement AZURE_OPENAI_ENDPOINT et AZURE_OPENAI_API_KEY');
  }

  const url = `${AZURE_CONFIG.endpoint}/openai/deployments/${AZURE_CONFIG.deployment}/chat/completions?api-version=${AZURE_CONFIG.apiVersion}`;

  console.log('[Azure] Appel API:', url.replace(AZURE_CONFIG.apiKey, '***'));

  try {
    const response = await axios.post(
      url,
      {
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant expert en analyse de documentation technique. Tu réponds toujours en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_CONFIG.apiKey
        },
        timeout: AZURE_CONFIG.timeout
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Réponse Azure OpenAI invalide');
    }

    const content = response.data.choices[0].message.content.trim();

    // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Aucun JSON trouvé dans la réponse');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    if (error.response) {
      console.error('[Azure] Erreur API:', error.response.status, error.response.data);
      throw new Error(`Erreur Azure OpenAI (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('[Azure] Pas de réponse du serveur');
      throw new Error('Impossible de contacter Azure OpenAI. Vérifiez votre connexion et l\'endpoint.');
    } else {
      console.error('[Azure] Erreur:', error.message);
      throw error;
    }
  }
}

/**
 * Génère un résumé avec fallback si Azure non disponible
 */
function generateFallbackSummary(key) {
  console.log('[Azure] Génération d\'un résumé fallback');

  return {
    summary: `Documentation pour ${key}. Le résumé IA n'est pas disponible actuellement. Veuillez configurer Azure AI Foundry (Azure OpenAI) pour activer cette fonctionnalité. Consultez le README.md pour les instructions de configuration.`,
    checklist: [
      'Configurer les variables d\'environnement Azure',
      'Vérifier l\'endpoint et la clé API',
      'S\'assurer que le deployment est actif',
      'Tester la connexion avec /health',
      'Relancer la génération du résumé'
    ],
    common_errors: [
      'Endpoint Azure incorrect - Vérifier AZURE_OPENAI_ENDPOINT',
      'Clé API invalide - Régénérer la clé dans le portail Azure',
      'Deployment non trouvé - Vérifier AZURE_OPENAI_DEPLOYMENT'
    ],
    faqs: [
      {
        question: 'Où trouver mon endpoint Azure?',
        answer: 'Dans le portail Azure > Votre ressource OpenAI > Keys and Endpoint'
      },
      {
        question: 'Comment créer un deployment?',
        answer: 'Azure AI Studio > Deployments > Create new deployment'
      },
      {
        question: 'Quels modèles sont supportés?',
        answer: 'GPT-4, GPT-4-turbo, GPT-3.5-turbo sont recommandés'
      }
    ],
    _fallback: true,
    generated_at: new Date().toISOString()
  };
}

/**
 * Fonction principale : génère un résumé complet
 * @param {Object} options - Options
 * @param {string} options.key - Clé unique du document
 * @param {string} [options.text] - Texte direct à analyser
 * @param {string} [options.pdfPath] - Chemin vers un fichier PDF
 * @param {string} [options.url] - URL d'un document
 * @param {boolean} [options.isAutoSummary] - Si true, adapte le prompt pour résumé auto de page web
 * @returns {Promise<Object>} Résumé structuré
 */
export async function summarize({ key, text, pdfPath, url, isAutoSummary = false }) {
  console.log(`[Azure] Début génération résumé pour: ${key}${isAutoSummary ? ' (auto-summary)' : ''}`);

  let documentText = text;

  // Si un chemin PDF est fourni, extraire le texte
  if (!documentText && pdfPath) {
    console.log(`[Azure] Extraction texte depuis: ${pdfPath}`);

    // Résoudre le chemin (peut être relatif)
    let resolvedPath = pdfPath;
    if (!path.isAbsolute(pdfPath)) {
      resolvedPath = path.join(__dirname, '..', '..', 'extension', pdfPath);
    }

    try {
      documentText = await extractTextFromPDF(resolvedPath);
    } catch (error) {
      console.error('[Azure] Erreur extraction PDF:', error);
      // Continuer avec un fallback
      documentText = `Document ${key} - Impossible d'extraire le contenu`;
    }
  }

  // Si une URL est fournie (feature future)
  if (!documentText && url) {
    console.log(`[Azure] Téléchargement depuis URL non implémenté: ${url}`);
    documentText = `Document ${key} - Téléchargement URL à implémenter`;
  }

  // Si toujours pas de texte, erreur
  if (!documentText) {
    throw new Error('Aucun contenu à analyser fourni (text, pdfPath ou url requis)');
  }

  try {
    // Construire le prompt
    const prompt = buildPrompt(documentText, key, isAutoSummary, url);

    // Appeler Azure OpenAI
    const result = await callAzureOpenAI(prompt);

    // Ajouter des métadonnées
    result.key = key;
    result.generated_at = new Date().toISOString();
    result.source = 'azure-openai';

    console.log(`[Azure] Résumé généré avec succès pour: ${key}`);
    return result;

  } catch (error) {
    console.error('[Azure] Erreur lors de la génération:', error.message);

    // Retourner un fallback en cas d'erreur
    return generateFallbackSummary(key);
  }
}

/**
 * Script CLI pour tester la génération
 */
if (process.argv[1] && process.argv[1].endsWith("summarize.js")) {
  const args = process.argv.slice(2);

  if (args.includes('--sample')) {
    const sampleKey = args[args.indexOf('--sample') + 1] || 'test';

    console.log(`\n🧪 Test de génération de résumé pour: ${sampleKey}\n`);

    const sampleText = `
Guide de démarrage pour ${sampleKey}

Introduction:
Cette documentation fournit les informations essentielles pour bien débuter avec ${sampleKey}.

Étapes principales:
1. Configuration initiale
2. Création du premier projet
3. Tests et validation
4. Déploiement

Bonnes pratiques:
- Suivre les conventions de nommage
- Documenter son code
- Effectuer des revues régulières

Erreurs courantes:
- Oublier de sauvegarder les changements
- Ne pas tester avant de déployer
- Ignorer les avertissements
`;

    summarize({ key: sampleKey, text: sampleText })
      .then(result => {
        console.log('\n✅ Résumé généré:\n');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n');
      })
      .catch(error => {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
      });
  } else {
    console.log(`
Usage: node azure/summarize.js --sample <key>

Exemple: node azure/summarize.js --sample jira
`);
  }
}
