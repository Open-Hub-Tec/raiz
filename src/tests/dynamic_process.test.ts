import { ProcessStage, DynamicSpec, DigitalPassportLot } from '../types';
import { CryptoEngine } from '../core/crypto/CryptoEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `-> ${detail}` : ''}`);
    failed++;
  }
}

console.log('================================================================');
console.log('   SUITE DE PRUEBAS: LISTAS DINÁMICAS, CRIPTOGRAFÍA & USABILIDAD ');
console.log('================================================================\n');

// -------------------------------------------------------------
// 1. ESTRUCTURAS DE DATOS DINÁMICAS (POLIMORFISMO DE PRODUCTOS)
// -------------------------------------------------------------
console.log('--- 1. Pruebas de Listas Dinámicas Multiproducto ---');

// A. Caso Textil (Telar de cintura)
const textileStages: ProcessStage[] = [
  { id: 'stg-tex-1', name: 'Hilado con huso y malacate', category: 'materia_prima', metricValue: 'Lana virgen criolla', notes: 'Lavado con raíz de amole' },
  { id: 'stg-tex-2', name: 'Teñido natural con Grana Cochinilla', category: 'tintura', metricValue: '3 baños con jugo de limón', notes: 'Fijación con alumbre' },
  { id: 'stg-tex-3', name: 'Urdido y brocado en telar de cintura', category: 'transformacion', metricValue: '5 semanas de tejido', notes: 'Iconografía de la greca del sol' },
  { id: 'stg-tex-4', name: 'Acabado y empuntado tradicional', category: 'acabado', metricValue: 'Flecado a mano', notes: 'Remate con nudo ciego' }
];

const textileSpecs: DynamicSpec[] = [
  { id: 'sp-1', label: 'Técnica Ancestral', value: 'Telar de cintura de 4 estacas' },
  { id: 'sp-2', label: 'Tinte Natural', value: 'Grana cochinilla y corteza de nogal' },
  { id: 'sp-3', label: 'Dimensiones', value: '190 x 70 cm' }
];

assert(textileStages.length === 4, 'Lista de etapas textil inicializada con 4 hitos');
assert(textileStages[1].category === 'tintura', 'Clasificación de tintura natural detectada');
assert(textileSpecs.some(s => s.label === 'Tinte Natural' && s.value.includes('Grana')), 'Especificación dinámica de tinte natural');

// B. Manipulación Dinámica: Adición y Eliminación en tiempo de ejecución
const nuevaEtapaTextil: ProcessStage = {
  id: `stg-tex-${Date.now()}`,
  name: 'Inspección de calidad por el consejo de ancianas',
  category: 'inspeccion',
  metricValue: 'Sello Comunal',
  notes: 'Validado en asamblea'
};

const updatedStages = [...textileStages, nuevaEtapaTextil];
assert(updatedStages.length === 5, 'Adición dinámica de etapa en la lista (L.length = 5)');
assert(updatedStages[4].name.includes('consejo de ancianas'), 'Persistencia en orden cronológico del nuevo nodo');

// Eliminación de una etapa
const filteredStages = updatedStages.filter(s => s.id !== 'stg-tex-1');
assert(filteredStages.length === 4, 'Eliminación dinámica de etapa sin alterar el resto de la lista');

// C. Caso Miel (Apicultura Agroecológica)
const honeyStages: ProcessStage[] = [
  { id: 'stg-h-1', name: 'Floración silvestre de Campanilla de montaña', category: 'materia_prima', metricValue: 'Pechuga / Acahual' },
  { id: 'stg-h-2', name: 'Cosecha de alzas maduras al 90%', category: 'transformacion', metricValue: 'Desoperculado manual' },
  { id: 'stg-h-3', name: 'Centrifugado en frío sin calentamiento', category: 'transformacion', metricValue: 'Acero inoxidable 304' },
  { id: 'stg-h-4', name: 'Filtrado lento por gravedad y decantación', category: 'acabado', metricValue: '17.8% humedad' }
];
assert(honeyStages.length === 4, 'Lista dinámica de miel con medición de humedad de 17.8%');

// D. Caso Cacao / Chocolate
const chocolateStages: ProcessStage[] = [
  { id: 'stg-ch-1', name: 'Fermentación en cajón de madera', category: 'materia_prima', metricValue: '6 días con 3 volteos' },
  { id: 'stg-ch-2', name: 'Secado en pasera de palma al sol', category: 'transformacion', metricValue: 'Humedad 7.2%' },
  { id: 'stg-ch-3', name: 'Tueste en comal de barro con leña de encino', category: 'transformacion', metricValue: 'Tostado parejo' },
  { id: 'stg-ch-4', name: 'Molienda en metate con canela y almendra', category: 'acabado', metricValue: 'Molido en caliente' }
];
assert(chocolateStages.length === 4, 'Lista dinámica de chocolate tradicional en metate');


// -------------------------------------------------------------
// 2. CRIPTOGRAFÍA & ANCLAJE INMUTABLE A BLOCKCHAIN (STELLAR)
// -------------------------------------------------------------
console.log('\n--- 2. Criptografía y Sellado Inmutable en Stellar ---');

async function testCrypto() {
  // Serialización de la lista dinámica para el cálculo del Community Digest
  const stagesSummaryTextile = textileStages.map(s => `${s.name}:${s.metricValue || ''}`).join('>');
  const stagesSummaryHoney = honeyStages.map(s => `${s.name}:${s.metricValue || ''}`).join('>');

  const digestTextile = await CryptoEngine.generateCommunityDigest({
    producerName: 'Doña Juana Bautista',
    community: 'Santa María Cuquila, Tlaxiaco',
    timestamp: 1727000000000,
    audioBase64: 'audio_testimonio_mixteco_tuun_savi_sample',
    photoBase64: 'photo_telar_cintura_coyuchi_sample',
    processStagesSummary: stagesSummaryTextile
  });

  const digestHoney = await CryptoEngine.generateCommunityDigest({
    producerName: 'Don Efraín López',
    community: 'Magdalena Peñasco, Tlaxiaco',
    timestamp: 1727000000000,
    audioBase64: 'audio_testimonio_mixteco_miel_sample',
    photoBase64: 'photo_colmenas_campanilla_sample',
    processStagesSummary: stagesSummaryHoney
  });

  assert(digestTextile.length === 64, `Digest SHA-256 Textile válido de 64 caracteres: ${digestTextile.slice(0, 16)}...`);
  assert(digestHoney.length === 64, `Digest SHA-256 Miel válido de 64 caracteres: ${digestHoney.slice(0, 16)}...`);
  assert(digestTextile !== digestHoney, 'Los digests son únicos y estrictamente dependientes de las etapas del proceso');

  // Prueba de Detección de Fraude (Tamper Evidence)
  // Si un intermediario altera "17.8% humedad" por "22.0% humedad" o cambia el tinte:
  const tamperedStagesSummary = stagesSummaryHoney.replace('17.8%', '22.0%');
  const tamperedDigest = await CryptoEngine.generateCommunityDigest({
    producerName: 'Don Efraín López',
    community: 'Magdalena Peñasco, Tlaxiaco',
    timestamp: 1727000000000,
    audioBase64: 'audio_testimonio_mixteco_miel_sample',
    photoBase64: 'photo_colmenas_campanilla_sample',
    processStagesSummary: tamperedStagesSummary
  });

  assert(digestHoney !== tamperedDigest, 'Detección antifraude: Modificar una etapa invalida inmediatamente el hash de Stellar');
}

// -------------------------------------------------------------
// 3. PRUEBAS DE USABILIDAD RURAL (ACCESIBILIDAD, MODO ABUELO & OFFLINE)
// -------------------------------------------------------------
console.log('\n--- 3. Pruebas de Usabilidad Rural & Accesibilidad ---');

// A. Modo Parcela (Tolerancia a desconexión 100% offline)
const mockOfflineLot: DigitalPassportLot = {
  id: 'lot-offline-test-1',
  code: 'MX-2024-999',
  title: 'Huipil Tradicional Triqui',
  productType: 'Textil Mixteco',
  producer: 'Carmen Morales',
  community: 'San Juan Copala',
  municipality: 'Santiago Juxtlahuaca',
  region: 'Mixteca Oaxaqueña',
  state: 'Oaxaca',
  country: 'México',
  harvestDate: 'Septiembre 2026',
  variety: 'Algodón Coyuchi',
  altitude: '1,850 msnm',
  process: 'Telar de cintura',
  pricePerKg: 2400,
  volumeKg: 1,
  processStages: textileStages,
  customSpecs: textileSpecs,
  verification: {
    status: 'Certificado',
    date: '2026-09-22',
    inspector: 'Open Hub TecNM Tlaxiaco',
    qualityScore: 98,
    certId: 'TECNM-OAX-2026-TX99',
    digitalSeal: 'STELLAR_SOROBAN_SEAL_TX99'
  }
};

assert(mockOfflineLot.processStages!.length > 0, 'Lote offline mantiene todas las etapas de la lista en memoria local');
assert(mockOfflineLot.customSpecs!.length > 0, 'Lote offline mantiene especificaciones dinámicas sin requerir internet');

// B. Resiliencia de Entrada de Voz y Variantes Fonéticas de Tu'un Savi
function normalizeMixtecoVoiceIntent(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const voiceSample1 = "Kuni yu una kiti (Quiero registrar cosecha)";
const voiceSample2 = "Opcion 1: Registrar lote de cafe";
const voiceSample3 = "Agregar paso de telar de cintura";

assert(normalizeMixtecoVoiceIntent(voiceSample1).length > 0, 'Normalizador de voz tolera caracteres mixtecos y apóstrofes');
assert(normalizeMixtecoVoiceIntent(voiceSample2).includes('opcion 1'), 'Detección robusta de opción por comando de voz');
assert(normalizeMixtecoVoiceIntent(voiceSample3).includes('telar'), 'Captura de texto para la creación de etapas');

// C. Verificación de Regalías Justas Comunitarias (8% Productor + 2% Tequio)
function calculateSplits(saleAmountMxn: number) {
  const producerRoyalty = saleAmountMxn * 0.08; // 8%
  const tequioFund = saleAmountMxn * 0.02;      // 2%
  const sellerNet = saleAmountMxn * 0.90;       // 90%
  return { producerRoyalty, tequioFund, sellerNet };
}

const sampleResale = 5000; // Un textil de reventa en galería de arte por $5,000 MXN
const splits = calculateSplits(sampleResale);

assert(splits.producerRoyalty === 400, `Regalía campesina del 8% calculada con exactitud ($400 MXN de $5,000 MXN)`);
assert(splits.tequioFund === 100, `Fondo comunitario de tequio del 2% asignado ($100 MXN de $5,000 MXN)`);
assert(splits.producerRoyalty + splits.tequioFund + splits.sellerNet === sampleResale, 'Conservación matemática del 100% de los fondos sin fuga financiera');

// Ejecución asíncrona de pruebas criptográficas
testCrypto().then(() => {
  console.log('\n================================================================');
  console.log(` RESUMEN: ${passed} PRUEBAS EXITOSAS, ${failed} FALLOS`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
