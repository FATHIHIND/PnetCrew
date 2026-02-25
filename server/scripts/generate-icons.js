#!/usr/bin/env node

/**
 * Script de génération d'icônes pour l'extension Chrome SmartContext Doc
 * Génère icon16.png, icon32.png, icon48.png, icon128.png
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ICON_SIZES = [16, 32, 48, 128];
const OUTPUT_DIR = path.join(__dirname, '../../extension');
const COLORS = {
  primary: '#4F46E5',    // Indigo moderne
  secondary: '#06B6D4',  // Cyan
  background: '#FFFFFF',
  text: '#1F2937'
};

/**
 * Crée un SVG pour l'icône SmartContext Doc
 * Design : Document avec un cerveau/intelligence symbolique
 */
function createIconSVG(size) {
  const padding = Math.floor(size * 0.1);
  const strokeWidth = Math.max(1, Math.floor(size * 0.05));

  // Calcul des dimensions internes
  const innerSize = size - (padding * 2);
  const docWidth = innerSize * 0.6;
  const docHeight = innerSize * 0.8;
  const docX = padding + (innerSize - docWidth) / 2;
  const docY = padding + (innerSize - docHeight) / 2;

  // Coin plié du document
  const foldSize = docWidth * 0.2;

  // Icône cerveau/AI au centre
  const iconSize = docWidth * 0.4;
  const iconX = docX + (docWidth - iconSize) / 2;
  const iconY = docY + docHeight * 0.35;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${size}" height="${size}" fill="${COLORS.background}" rx="${size * 0.15}"/>

      <!-- Document background -->
      <path d="
        M ${docX} ${docY}
        L ${docX + docWidth - foldSize} ${docY}
        L ${docX + docWidth} ${docY + foldSize}
        L ${docX + docWidth} ${docY + docHeight}
        L ${docX} ${docY + docHeight}
        Z
      " fill="${COLORS.primary}" opacity="0.1"/>

      <!-- Document outline -->
      <path d="
        M ${docX} ${docY}
        L ${docX + docWidth - foldSize} ${docY}
        L ${docX + docWidth} ${docY + foldSize}
        L ${docX + docWidth} ${docY + docHeight}
        L ${docX} ${docY + docHeight}
        Z
      " fill="none" stroke="${COLORS.primary}" stroke-width="${strokeWidth}"/>

      <!-- Coin plié -->
      <path d="
        M ${docX + docWidth - foldSize} ${docY}
        L ${docX + docWidth - foldSize} ${docY + foldSize}
        L ${docX + docWidth} ${docY + foldSize}
      " fill="none" stroke="${COLORS.primary}" stroke-width="${strokeWidth}"/>

      <!-- Icône AI/Cerveau simplifié (3 cercles connectés) -->
      <circle cx="${iconX + iconSize * 0.5}" cy="${iconY}" r="${iconSize * 0.15}"
              fill="${COLORS.secondary}"/>
      <circle cx="${iconX}" cy="${iconY + iconSize * 0.6}" r="${iconSize * 0.15}"
              fill="${COLORS.secondary}"/>
      <circle cx="${iconX + iconSize}" cy="${iconY + iconSize * 0.6}" r="${iconSize * 0.15}"
              fill="${COLORS.secondary}"/>

      <!-- Lignes de connexion -->
      <line x1="${iconX + iconSize * 0.5}" y1="${iconY + iconSize * 0.15}"
            x2="${iconX + iconSize * 0.15}" y2="${iconY + iconSize * 0.45}"
            stroke="${COLORS.secondary}" stroke-width="${strokeWidth * 0.8}"/>
      <line x1="${iconX + iconSize * 0.5}" y1="${iconY + iconSize * 0.15}"
            x2="${iconX + iconSize * 0.85}" y2="${iconY + iconSize * 0.45}"
            stroke="${COLORS.secondary}" stroke-width="${strokeWidth * 0.8}"/>
      <line x1="${iconX}" y1="${iconY + iconSize * 0.6}"
            x2="${iconX + iconSize}" y2="${iconY + iconSize * 0.6}"
            stroke="${COLORS.secondary}" stroke-width="${strokeWidth * 0.8}" opacity="0.5"/>

      <!-- Lignes de texte sur le document -->
      ${size >= 48 ? `
        <line x1="${docX + docWidth * 0.2}" y1="${docY + docHeight * 0.75}"
              x2="${docX + docWidth * 0.8}" y2="${docY + docHeight * 0.75}"
              stroke="${COLORS.primary}" stroke-width="${strokeWidth * 0.7}" opacity="0.3"/>
        <line x1="${docX + docWidth * 0.2}" y1="${docY + docHeight * 0.85}"
              x2="${docX + docWidth * 0.6}" y2="${docY + docHeight * 0.85}"
              stroke="${COLORS.primary}" stroke-width="${strokeWidth * 0.7}" opacity="0.3"/>
      ` : ''}
    </svg>
  `;
}

/**
 * Génère une icône PNG à la taille spécifiée
 */
async function generateIcon(size) {
  const svgBuffer = Buffer.from(createIconSVG(size));
  const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);

  try {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Généré: icon${size}.png`);
  } catch (error) {
    console.error(`✗ Erreur lors de la génération de icon${size}.png:`, error.message);
    throw error;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🎨 Génération des icônes SmartContext Doc...\n');

  // Vérifier que le dossier de sortie existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error(`✗ Le dossier ${OUTPUT_DIR} n'existe pas`);
    process.exit(1);
  }

  // Générer toutes les icônes
  try {
    for (const size of ICON_SIZES) {
      await generateIcon(size);
    }

    console.log('\n✅ Toutes les icônes ont été générées avec succès !');
    console.log(`📁 Emplacement: ${OUTPUT_DIR}`);
    console.log('\n💡 Rechargez l\'extension dans chrome://extensions pour voir les nouvelles icônes.');
  } catch (error) {
    console.error('\n❌ Erreur lors de la génération des icônes');
    process.exit(1);
  }
}

// Exécution
main();
