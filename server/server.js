/**
 * Serveur Express pour SmartContext Doc
 * Gère le mapping, les résumés IA et les intégrations
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { summarize } from './azure/summarize.js';
import PDFDocument from 'pdfkit';
import smartTicketRoutes from './smartticket/routes/smartticket.routes.js';

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8787;

// Cache en mémoire pour les résumés
const summariesCache = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques (docs PDF)
app.use('/docs', express.static(path.join(__dirname, '..', 'extension', 'docs')));

// Routes SmartTicket
app.use('/smartticket', smartTicketRoutes);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /mapping.json
 * Renvoie le mapping des URLs vers les documentations
 */
app.get('/mapping.json', async (req, res) => {
  try {
    const mappingPath = path.join(__dirname, 'data', 'mapping.json');
    const mappingData = await fs.readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(mappingData);

    res.json(mapping);
  } catch (error) {
    console.error('[Server] Erreur lecture mapping:', error);
    res.status(500).json({
      error: 'Impossible de charger le mapping',
      message: error.message
    });
  }
});

/**
 * GET /summaries/:key
 * Renvoie le résumé IA pour une documentation
 */
app.get('/summaries/:key', async (req, res) => {
  const { key } = req.params;

  try {
    // Vérifier le cache mémoire
    if (summariesCache.has(key)) {
      console.log(`[Server] Résumé trouvé en cache: ${key}`);
      return res.json(summariesCache.get(key));
    }

    // Vérifier le fichier sur disque
    const summaryPath = path.join(__dirname, 'data', 'summaries', `${key}.json`);

    try {
      const summaryData = await fs.readFile(summaryPath, 'utf-8');
      const summary = JSON.parse(summaryData);

      // Mettre en cache
      summariesCache.set(key, summary);

      console.log(`[Server] Résumé trouvé sur disque: ${key}`);
      return res.json(summary);
    } catch (fileError) {
      // Fichier non trouvé
      console.log(`[Server] Résumé non disponible: ${key}`);
      return res.status(404).json({
        error: 'Résumé non disponible',
        message: `Aucun résumé trouvé pour la clé: ${key}`,
        hint: 'Utilisez POST /summarize pour générer un résumé'
      });
    }
  } catch (error) {
    console.error('[Server] Erreur récupération résumé:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

/**
 * POST /ingest
 * Ajoute ou met à jour une entrée dans le mapping
 */
app.post('/ingest', async (req, res) => {
  const { key, title, urlMatch, docUrlOrPath } = req.body;

  // Validation
  if (!key || !title || !urlMatch || !docUrlOrPath) {
    return res.status(400).json({
      error: 'Paramètres manquants',
      required: ['key', 'title', 'urlMatch', 'docUrlOrPath']
    });
  }

  try {
    const mappingPath = path.join(__dirname, 'data', 'mapping.json');

    // Charger le mapping existant
    let mapping = [];
    try {
      const mappingData = await fs.readFile(mappingPath, 'utf-8');
      mapping = JSON.parse(mappingData);
    } catch (error) {
      // Fichier n'existe pas encore
      console.log('[Server] Création du mapping initial');
    }

    // Trouver si l'entrée existe déjà
    const existingIndex = mapping.findIndex(entry => entry.key === key);

    const newEntry = {
      key,
      match: Array.isArray(urlMatch) ? urlMatch : [urlMatch],
      title,
      path: docUrlOrPath,
      tags: req.body.tags || [],
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Mise à jour
      mapping[existingIndex] = { ...mapping[existingIndex], ...newEntry };
      console.log(`[Server] Mise à jour mapping: ${key}`);
    } else {
      // Ajout
      mapping.push(newEntry);
      console.log(`[Server] Ajout mapping: ${key}`);
    }

    // Sauvegarder
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');

    // Copier vers l'extension (optionnel, pour synchronisation)
    try {
      const extensionMappingPath = path.join(__dirname, '..', 'extension', 'mapping.json');
      await fs.writeFile(extensionMappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
      console.log('[Server] Mapping synchronisé avec l\'extension');
    } catch (syncError) {
      console.warn('[Server] Avertissement: synchronisation extension échouée:', syncError.message);
    }

    res.json({
      status: 'updated',
      key,
      title,
      message: 'Mapping mis à jour avec succès'
    });

  } catch (error) {
    console.error('[Server] Erreur ingest:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour',
      message: error.message
    });
  }
});

/**
 * POST /summarize
 * Génère un résumé IA pour une documentation
 */
app.post('/summarize', async (req, res) => {
  const { key, docUrlOrPath, text } = req.body;

  if (!key) {
    return res.status(400).json({
      error: 'Paramètre "key" manquant'
    });
  }

  try {
    console.log(`[Server] Génération résumé pour: ${key}`);

    // Appeler le module Azure
    const summary = await summarize({
      key,
      text,
      pdfPath: docUrlOrPath,
      url: docUrlOrPath
    });

    // Sauvegarder sur disque
    const summariesDir = path.join(__dirname, 'data', 'summaries');
    await fs.mkdir(summariesDir, { recursive: true });

    const summaryPath = path.join(summariesDir, `${key}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');

    // Mettre en cache
    summariesCache.set(key, summary);

    console.log(`[Server] Résumé généré et sauvegardé: ${key}`);

    res.json({
      status: 'success',
      key,
      summary: summary.summary,
      message: 'Résumé généré avec succès'
    });

  } catch (error) {
    console.error('[Server] Erreur génération résumé:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du résumé',
      message: error.message
    });
  }
});

/**
 * POST /auto-summarize
 * Génère automatiquement un résumé IA contextuel pour n'importe quelle page web
 * Utilisé quand aucun mapping n'existe pour l'URL
 */
app.post('/auto-summarize', async (req, res) => {
  const { url, html, text } = req.body;

  // Validation
  if (!url) {
    return res.status(400).json({
      error: 'Paramètre "url" manquant',
      required: ['url']
    });
  }

  if (!text && !html) {
    return res.status(400).json({
      error: 'Au moins "text" ou "html" doit être fourni',
      required: ['text', 'html']
    });
  }

  try {
    console.log(`[Server] Génération auto-résumé pour: ${url}`);

    // Utiliser le texte si disponible, sinon fallback sur HTML
    const contentToSummarize = text || html || '';

    if (contentToSummarize.length < 50) {
      return res.status(400).json({
        error: 'Contenu trop court pour générer un résumé',
        message: 'Le contenu doit contenir au moins 50 caractères'
      });
    }

    // Générer une clé temporaire basée sur l'URL
    const urlHash = Buffer.from(url).toString('base64').substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
    const tempKey = `auto_${urlHash}`;

    // Appeler Azure OpenAI avec un prompt adapté pour les pages web
    const summary = await summarize({
      key: tempKey,
      text: contentToSummarize,
      url: url,
      isAutoSummary: true // Flag pour adapter le prompt
    });

    // Ajouter les métadonnées
    const result = {
      ...summary,
      url,
      generated_at: new Date().toISOString(),
      source: 'auto-summary',
      is_temporary: true
    };

    // Optionnel : sauvegarder dans un cache temporaire (pas persistant)
    summariesCache.set(tempKey, result);

    console.log(`[Server] Auto-résumé généré pour: ${url}`);

    res.json({
      status: 'success',
      url,
      ...result
    });

  } catch (error) {
    console.error('[Server] Erreur auto-summarize:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du résumé automatique',
      message: error.message,
      details: error.stack
    });
  }
});

/**
 * GET /summaries
 * Liste tous les résumés disponibles
 */
app.get('/summaries', async (req, res) => {
  try {
    const summariesDir = path.join(__dirname, 'data', 'summaries');

    // Créer le dossier s'il n'existe pas
    await fs.mkdir(summariesDir, { recursive: true });

    const files = await fs.readdir(summariesDir);
    const summaries = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));

    res.json({
      count: summaries.length,
      summaries
    });
  } catch (error) {
    console.error('[Server] Erreur liste résumés:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la liste',
      message: error.message
    });
  }
});

/**
 * POST /export/pdf
 * Génère un PDF du résumé IA avec encodage UTF-8 correct
 * Body: { url, summary, checklist, common_errors, faqs, title }
 */
app.post('/export/pdf', async (req, res) => {
  const { url, summary, checklist, common_errors, faqs, title } = req.body;

  // Validation
  if (!summary && !checklist && !common_errors && !faqs) {
    return res.status(400).json({
      error: 'Au moins une section doit être fournie',
      required: ['summary', 'checklist', 'common_errors', 'faqs']
    });
  }

  try {
    console.log('[Server] Génération PDF pour:', url || 'résumé IA');

    // Créer un nouveau document PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      bufferPages: true,
      autoFirstPage: true
    });

    // Configuration des en-têtes HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=smartcontext-${Date.now()}.pdf`);

    // Pipe le PDF vers la réponse HTTP
    doc.pipe(res);

    // Chemins des polices Unicode
    const fontPath = path.join(__dirname, 'fonts');
    const regularFont = path.join(fontPath, 'Roboto-Regular.ttf');
    const boldFont = path.join(fontPath, 'Roboto-Bold.ttf');

    // Vérifier que les polices existent
    try {
      await fs.access(regularFont);
      await fs.access(boldFont);
    } catch (error) {
      throw new Error('Polices Unicode non trouvées. Exécutez : mkdir fonts && téléchargez Roboto');
    }

    // Enregistrer les polices Unicode
    doc.registerFont('Roboto', regularFont);
    doc.registerFont('Roboto-Bold', boldFont);

    // Variables de mise en page
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // Fonction helper pour ajouter du texte
    const addText = (text, options = {}) => {
      const {
        fontSize = 12,
        font = 'Roboto',
        color = '#000000',
        align = 'left',
        continued = false
      } = options;

      doc.font(font)
         .fontSize(fontSize)
         .fillColor(color)
         .text(text, {
           width: contentWidth,
           align: align,
           continued: continued
         });
    };

    const addSpacer = (height = 10) => {
      doc.moveDown(height / 12);
    };

    const addLine = () => {
      const y = doc.y;
      doc.strokeColor('#E5E7EB')
         .lineWidth(1)
         .moveTo(margin, y)
         .lineTo(pageWidth - margin, y)
         .stroke();
      addSpacer(10);
    };

    // === EN-TÊTE ===
    doc.rect(0, 0, pageWidth, 60)
       .fill('#2563EB');

    doc.font('Roboto-Bold')
       .fontSize(24)
       .fillColor('#FFFFFF')
       .text('📚 SmartContext Doc', margin, 20, {
         width: contentWidth,
         align: 'left'
       });

    doc.font('Roboto')
       .fontSize(12)
       .text('Documentation IA générée automatiquement', margin, 45);

    doc.y = 80;

    // === MÉTADONNÉES ===
    doc.rect(margin, doc.y, contentWidth, 60)
       .fill('#F9FAFB');

    doc.fillColor('#4B5563')
       .font('Roboto-Bold')
       .fontSize(10);

    const metaY = doc.y + 10;

    if (url) {
      doc.text('URL:', margin + 10, metaY);
      doc.font('Roboto')
         .text(url, margin + 40, metaY, {
           width: contentWidth - 50,
           ellipsis: true
         });
    }

    if (title) {
      doc.font('Roboto-Bold')
         .text('Titre:', margin + 10, metaY + 15);
      doc.font('Roboto')
         .text(title, margin + 40, metaY + 15, {
           width: contentWidth - 50,
           ellipsis: true
         });
    }

    doc.font('Roboto-Bold')
       .text('Date:', margin + 10, metaY + 30);
    doc.font('Roboto')
       .text(new Date().toLocaleString('fr-FR'), margin + 40, metaY + 30);

    doc.y = doc.y + 70;
    addLine();

    // === RÉSUMÉ ===
    if (summary) {
      addText('🤖 Résumé', {
        fontSize: 18,
        font: 'Roboto-Bold',
        color: '#2563EB'
      });
      addSpacer(8);

      addText(summary, {
        fontSize: 11,
        color: '#1F2937'
      });
      addSpacer(15);
      addLine();
    }

    // === CHECKLIST ===
    if (checklist && checklist.length > 0) {
      addText('✅ Checklist', {
        fontSize: 18,
        font: 'Roboto-Bold',
        color: '#16A34A'
      });
      addSpacer(8);

      checklist.forEach((item, index) => {
        // Vérifier si on doit ajouter une nouvelle page
        if (doc.y > pageHeight - 100) {
          doc.addPage();
        }

        doc.font('Roboto')
           .fontSize(10)
           .fillColor('#1F2937')
           .text(`${index + 1}. ${item}`, margin + 10, doc.y, {
             width: contentWidth - 20,
             indent: 0
           });

        addSpacer(5);
      });

      addSpacer(10);
      addLine();
    }

    // === ERREURS FRÉQUENTES ===
    if (common_errors && common_errors.length > 0) {
      if (doc.y > pageHeight - 150) {
        doc.addPage();
      }

      addText('⚠️ Erreurs fréquentes', {
        fontSize: 18,
        font: 'Roboto-Bold',
        color: '#DC2626'
      });
      addSpacer(8);

      common_errors.forEach((error, index) => {
        if (doc.y > pageHeight - 100) {
          doc.addPage();
        }

        doc.font('Roboto')
           .fontSize(10)
           .fillColor('#991B1B')
           .text(`${index + 1}. ${error}`, margin + 10, doc.y, {
             width: contentWidth - 20
           });

        addSpacer(5);
      });

      addSpacer(10);
      addLine();
    }

    // === FAQ ===
    if (faqs && faqs.length > 0) {
      if (doc.y > pageHeight - 150) {
        doc.addPage();
      }

      addText('❓ FAQ', {
        fontSize: 18,
        font: 'Roboto-Bold',
        color: '#2563EB'
      });
      addSpacer(8);

      faqs.forEach((faq, index) => {
        if (doc.y > pageHeight - 120) {
          doc.addPage();
        }

        const question = faq.question || faq.q || '';
        const answer = faq.answer || faq.a || '';

        // Question
        doc.font('Roboto-Bold')
           .fontSize(11)
           .fillColor('#2563EB')
           .text(`Q${index + 1}: ${question}`, margin + 5, doc.y, {
             width: contentWidth - 10
           });

        addSpacer(3);

        // Réponse
        doc.font('Roboto')
           .fontSize(10)
           .fillColor('#4B5563')
           .text(answer, margin + 5, doc.y, {
             width: contentWidth - 10
           });

        addSpacer(8);
      });
    }

    // === FOOTER ===
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);

      doc.font('Roboto')
         .fontSize(9)
         .fillColor('#9CA3AF')
         .text(
           `Généré par SmartContext Doc - Page ${i + 1}/${range.count}`,
           margin,
           pageHeight - 30,
           {
             width: contentWidth,
             align: 'center'
           }
         );
    }

    // Finaliser le PDF
    doc.end();

    console.log('[Server] PDF généré avec succès');

  } catch (error) {
    console.error('[Server] Erreur génération PDF:', error);

    // Si le PDF a déjà commencé à être envoyé, on ne peut pas envoyer de JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Erreur lors de la génération du PDF',
        message: error.message
      });
    }
  }
});

/**
 * Gestion des erreurs 404
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.url,
    method: req.method
  });
});

/**
 * Gestion des erreurs globales
 */
app.use((err, req, res, next) => {
  console.error('[Server] Erreur non gérée:', err);
  res.status(500).json({
    error: 'Erreur serveur',
    message: err.message
  });
});

/**
 * Démarrage du serveur
 */
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     SmartContext Doc - Serveur API        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   GET  /health              - Health check`);
  console.log(`   GET  /mapping.json        - Récupérer le mapping`);
  console.log(`   GET  /summaries           - Liste des résumés`);
  console.log(`   GET  /summaries/:key      - Récupérer un résumé`);
  console.log(`   POST /ingest              - Ajouter/MAJ mapping`);
  console.log(`   POST /summarize           - Générer résumé IA`);
  console.log(`   POST /auto-summarize      - Résumé IA automatique (toute page)`);
  console.log(`   POST /export/pdf          - Exporter résumé en PDF (UTF-8)`);
  console.log(`\n🎟️  SmartTicket - Analyse de tickets:`);
  console.log(`   GET  /smartticket/health    - Health check`);
  console.log(`   POST /smartticket/analyze   - Analyser un ticket`);
  console.log(`   GET  /smartticket/scan-all  - Scanner tous les tickets`);
  console.log(`   POST /smartticket/analyze-batch - Analyse batch`);
  console.log(`\n📁 Fichiers statiques: /docs/\n`);
});

export default app;
