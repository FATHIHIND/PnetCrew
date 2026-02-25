/**
 * Excel Loader - Charge et parse le fichier Excel des tickets
 * Utilise XLSX.js pour lire data/tickets_seed.xlsx
 */

/**
 * Charge le fichier Excel depuis l'extension
 * @returns {Promise<Array>} Tableau d'objets tickets
 */
export async function loadExcelSeed() {
  console.log('[ExcelLoader] Chargement du fichier Excel...');

  try {
    // Utiliser chrome.runtime.getURL pour pointer vers le fichier
    const fileUrl = chrome.runtime.getURL('data/tickets_seed.xlsx');
    console.log('[ExcelLoader] URL fichier:', fileUrl);

    // Fetch le fichier
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    // Convertir en ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Parser avec XLSX
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir en JSON
    const tickets = XLSX.utils.sheet_to_json(sheet);

    console.log(`[ExcelLoader] ${tickets.length} tickets chargés depuis Excel`);

    return tickets;

  } catch (error) {
    console.error('[ExcelLoader] Erreur chargement Excel:', error);
    console.error('[ExcelLoader] Type d\'erreur:', error.name);
    console.error('[ExcelLoader] Message:', error.message);
    console.error('[ExcelLoader] Stack:', error.stack);
    throw error;
  }
}

/**
 * Normalise un ticket depuis le format Excel
 * @param {Object} rawTicket - Ticket brut depuis Excel
 * @returns {Object} Ticket normalisé
 */
export function normalizeTicket(rawTicket) {
  return {
    id_ticket: String(rawTicket.id_ticket || rawTicket.ID || rawTicket.Id || ''),
    title: String(rawTicket.title || rawTicket.Title || rawTicket.titre || ''),
    description: String(rawTicket.description || rawTicket.Description || rawTicket.desc || ''),
    modules: String(rawTicket.modules || rawTicket.Modules || ''),
    priority: String(rawTicket.priority || rawTicket.Priority || rawTicket.priorite || 'normal'),
    category: String(rawTicket.category || rawTicket.Category || rawTicket.categorie || '')
  };
}

/**
 * Charge et normalise les tickets Excel
 * @returns {Promise<Array>} Tickets normalisés
 */
export async function loadAndNormalizeTickets() {
  const rawTickets = await loadExcelSeed();
  return rawTickets.map(normalizeTicket);
}

export default {
  loadExcelSeed,
  normalizeTicket,
  loadAndNormalizeTickets
};
