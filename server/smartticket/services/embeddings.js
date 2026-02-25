/**
 * Service Embeddings - Génération de vecteurs via Azure OpenAI
 * Utilisé pour créer la base vectorielle des tickets
 */

import { AzureOpenAI } from '@azure/openai';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Azure OpenAI
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-2';

// Client Azure OpenAI
let client = null;

if (endpoint && apiKey) {
  client = new AzureOpenAI({
    endpoint,
    apiKey,
    deployment
  });
  console.log('[Embeddings] Client Azure OpenAI initialisé');
} else {
  console.warn('[Embeddings] Azure OpenAI non configuré - embeddings désactivés');
}

/**
 * Génère un embedding vectoriel pour un texte
 * @param {string} text - Texte à vectoriser
 * @returns {Promise<number[]>} Vecteur d'embeddings (1536 dimensions pour text-embedding-ada-002)
 */
export async function generateEmbedding(text) {
  if (!client) {
    throw new Error('Azure OpenAI non configuré');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Texte vide');
  }

  try {
    console.log(`[Embeddings] Génération embedding pour texte de ${text.length} caractères`);

    // Appel à l'API Azure OpenAI pour générer l'embedding
    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    const embedding = response.data[0].embedding;

    console.log(`[Embeddings] Embedding généré : ${embedding.length} dimensions`);

    return embedding;

  } catch (error) {
    console.error('[Embeddings] Erreur génération embedding:', error);
    throw error;
  }
}

/**
 * Génère des embeddings pour plusieurs textes en batch
 * @param {string[]} texts - Tableau de textes
 * @returns {Promise<number[][]>} Tableau d'embeddings
 */
export async function generateEmbeddingsBatch(texts) {
  if (!client) {
    throw new Error('Azure OpenAI non configuré');
  }

  if (!texts || texts.length === 0) {
    throw new Error('Tableau de textes vide');
  }

  try {
    console.log(`[Embeddings] Génération batch de ${texts.length} embeddings`);

    const response = await client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: texts
    });

    const embeddings = response.data.map(item => item.embedding);

    console.log(`[Embeddings] ${embeddings.length} embeddings générés`);

    return embeddings;

  } catch (error) {
    console.error('[Embeddings] Erreur génération batch:', error);
    throw error;
  }
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 * @param {number[]} vecA - Premier vecteur
 * @param {number[]} vecB - Second vecteur
 * @returns {number} Score de similarité (0-1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Les vecteurs doivent avoir la même dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity
};
