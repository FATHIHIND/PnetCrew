/**
 * Vector DB - Gestion de la base vectorielle dans IndexedDB
 * Stocke les tickets avec leurs embeddings pour recherche sémantique
 */

const DB_NAME = 'smartticket-db';
const DB_VERSION = 1;
const STORE_NAME = 'tickets';

const SERVER_URL = 'http://localhost:8787';

/**
 * Ouvre la connexion à IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Créer le store si nécessaire
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id_ticket' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('modules', 'modules', { unique: false });
        console.log('[VectorDB] Object store créé');
      }
    };
  });
}

/**
 * Génère un embedding via l'API backend
 * @param {string} text - Texte à vectoriser
 * @returns {Promise<number[]>} Vecteur d'embeddings
 */
export async function computeEmbedding(text) {
  try {
    console.log(`[VectorDB] Génération embedding pour: ${text.substring(0, 50)}...`);

    const response = await fetch(`${SERVER_URL}/smartticket/embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[VectorDB] Embedding généré: ${data.dimensions} dimensions`);

    return data.embedding;

  } catch (error) {
    console.error('[VectorDB] Erreur génération embedding:', error);
    throw error;
  }
}

/**
 * Sauvegarde un ticket avec son embedding dans IndexedDB
 * @param {Object} ticket - Ticket à sauvegarder
 * @param {number[]} embedding - Vecteur d'embeddings
 * @returns {Promise<void>}
 */
export async function saveVectorRecord(ticket, embedding) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      ...ticket,
      embedding: embedding,
      indexed_at: new Date().toISOString()
    };

    const request = store.put(record);

    request.onsuccess = () => {
      console.log(`[VectorDB] Ticket ${ticket.id_ticket} sauvegardé`);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupère tous les tickets de la base
 * @returns {Promise<Array>}
 */
export async function getAllTickets() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Compte le nombre de tickets dans la base
 * @returns {Promise<number>}
 */
export async function countTickets() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Vide complètement la base (pour réinitialisation)
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[VectorDB] Base vidée');
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 * @param {number[]} vecA - Premier vecteur
 * @param {number[]} vecB - Second vecteur
 * @returns {number} Score de similarité (0-1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
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

/**
 * Recherche les tickets similaires à un embedding donné
 * @param {number[]} currentEmbedding - Embedding du ticket actuel
 * @param {number} topK - Nombre de résultats à retourner
 * @returns {Promise<Array>} Top K tickets similaires
 */
export async function findSimilarTickets(currentEmbedding, topK = 3) {
  console.log('[VectorDB] Recherche de tickets similaires...');

  const allTickets = await getAllTickets();

  if (allTickets.length === 0) {
    console.warn('[VectorDB] Base vide, aucun ticket similaire');
    return [];
  }

  // Calculer la similarité pour chaque ticket
  const ranked = allTickets.map(ticket => {
    const similarity = cosineSimilarity(currentEmbedding, ticket.embedding);

    return {
      id: ticket.id_ticket,
      title: ticket.title,
      description: ticket.description,
      modules: ticket.modules,
      category: ticket.category,
      priority: ticket.priority,
      similarity: similarity
    };
  });

  // Trier par similarité décroissante
  ranked.sort((a, b) => b.similarity - a.similarity);

  // Retourner les top K (en excluant le ticket lui-même si score = 1)
  const results = ranked
    .filter(t => t.similarity < 0.99) // Exclure le ticket identique
    .slice(0, topK);

  console.log(`[VectorDB] ${results.length} tickets similaires trouvés`);

  return results;
}

/**
 * Initialise la base vectorielle complète depuis Excel
 * @param {Array} tickets - Tickets depuis Excel
 * @param {Function} onProgress - Callback de progression (optionnel)
 * @returns {Promise<void>}
 */
export async function initializeVectorDB(tickets, onProgress = null) {
  console.log(`[VectorDB] Initialisation base vectorielle avec ${tickets.length} tickets`);

  const existingCount = await countTickets();

  if (existingCount > 0) {
    console.log(`[VectorDB] Base déjà initialisée (${existingCount} tickets)`);
    return;
  }

  let processed = 0;

  for (const ticket of tickets) {
    try {
      // Créer le texte combiné pour l'embedding
      const text = `${ticket.title}\n${ticket.description || ''}`;

      // Générer l'embedding
      const embedding = await computeEmbedding(text);

      // Sauvegarder
      await saveVectorRecord(ticket, embedding);

      processed++;

      if (onProgress) {
        onProgress(processed, tickets.length);
      }

      console.log(`[VectorDB] Progression: ${processed}/${tickets.length}`);

    } catch (error) {
      console.error(`[VectorDB] Erreur traitement ticket ${ticket.id_ticket}:`, error);
    }
  }

  console.log(`[VectorDB] ✅ Initialisation terminée: ${processed} tickets indexés`);
}

export default {
  computeEmbedding,
  saveVectorRecord,
  getAllTickets,
  countTickets,
  clearDatabase,
  cosineSimilarity,
  findSimilarTickets,
  initializeVectorDB
};
