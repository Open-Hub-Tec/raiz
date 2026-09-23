import { generateQrSvg, generateQrDataUri, QRCode, QRErrorCorrectLevel } from '../utils/qrCode';
import { INITIAL_VERIFIED_LOTS } from '../data/mockData';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('====================================================');
console.log('       SUITE DE PRUEBAS DEL SISTEMA QR (RAÍZ)       ');
console.log('====================================================\n');

// 1. Generación de QR offline y formato de folios
console.log('--- 1. Generación de Código QR y Validación de Folios ---');
for (const lot of INITIAL_VERIFIED_LOTS) {
  const formattedCode = lot.code.startsWith('MX-') ? lot.code : `MX-${lot.code}`;
  const url = `https://raiz.tecnm.mx/?cert=${encodeURIComponent(formattedCode)}`;

  // Validar que no haya doble prefijo MX-MX-
  assert(!formattedCode.startsWith('MX-MX-'), `Folio normalizado sin duplicación: ${formattedCode}`);

  // Validar generación de SVG vectorial offline
  const svg = generateQrSvg(url, { size: 240, color: '#032517' });
  assert(svg.includes('<svg') && svg.includes('</svg>'), `SVG vectorial generado para ${lot.code}`);
  assert(svg.includes('shape-rendering="crispEdges"'), `SVG optimizado para impresión térmica/kraft en ${lot.code}`);

  // Validar generación de Data URI para elementos <img>
  const dataUri = generateQrDataUri(url, { size: 240 });
  assert(dataUri.startsWith('data:image/svg+xml;utf8,'), `Data URI válido para ${lot.code}`);
}

// 2. Resolución de Deep-Links (Simulación de escaneo de cámara móvil)
console.log('\n--- 2. Resolución de Deep-Links (Escaneo de Cámara) ---');
function resolveScannedCode(queryString: string) {
  const urlParams = new URLSearchParams(queryString);
  const rawParam = urlParams.get('cert') || urlParams.get('lote') || urlParams.get('dictamen');
  if (!rawParam) return null;

  const cleanParam = rawParam.replace(/^(MX-)+/i, '').toLowerCase();
  return INITIAL_VERIFIED_LOTS.find(
    (l) =>
      l.code.toLowerCase() === rawParam.toLowerCase() ||
      l.code.toLowerCase() === cleanParam ||
      l.code.toLowerCase() === `mx-${cleanParam}` ||
      l.id.toLowerCase() === rawParam.toLowerCase() ||
      l.id.toLowerCase() === cleanParam ||
      l.code.toLowerCase().includes(cleanParam)
  ) || null;
}

const scenarios = [
  { query: '?cert=MX-2024-884', expected: 'Frijol Negro Criollo & Maíz Azul' },
  { query: '?cert=MX-2024-912', expected: 'Café Arábica Pluma Hidalgo Lavado' },
  { query: '?cert=2024-912', expected: 'Café Arábica Pluma Hidalgo Lavado' },
  { query: '?cert=mx-2024-765', expected: 'Miel Virgen de Campanilla de Montaña' },
  { query: '?lote=lot-884', expected: 'Frijol Negro Criollo & Maíz Azul' },
  { query: '?dictamen=MX-2024-912', expected: 'Café Arábica Pluma Hidalgo Lavado' },
  { query: '?cert=MX-MX-2024-912', expected: 'Café Arábica Pluma Hidalgo Lavado' },
];

for (const s of scenarios) {
  const result = resolveScannedCode(s.query);
  assert(
    result !== null && result.title === s.expected,
    `Escaneo ${s.query} -> ${s.expected}`
  );
}

// 3. Verificación de cumplimiento ISO/IEC 18004
console.log('\n--- 3. Conformidad Técnica ISO/IEC 18004 y Niveles ECC ---');
const qr = new QRCode(0, QRErrorCorrectLevel.M);
qr.addData('https://raiz.tecnm.mx/?cert=MX-2024-912');
qr.make();

assert(qr.getModuleCount() === 29, `Matriz de 29x29 módulos calculada para Versión 3`);
assert(qr.typeNumber === 3, `Versión de densidad auto-seleccionada: ${qr.typeNumber}`);
assert(qr.errorCorrectLevel === QRErrorCorrectLevel.M, `Nivel de redundancia M (15% recuperación de errores en campo)`);

console.log('\n====================================================');
console.log(` RESUMEN: ${passed} PRUEBAS EXITOSAS, ${failed} FALLOS`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
