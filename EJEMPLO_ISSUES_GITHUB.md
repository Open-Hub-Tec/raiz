# 📋 Rediseño Metodológico de Issues: Raíz Mixteca
**Institución:** Instituto Tecnológico de Tlaxiaco (TecNM) • Oaxaca, México  
**Repositorio:** `Open-Hub-Tec/raiz`  
**Destinatarios:** Estudiantes de Ingeniería en Sistemas Computacionales del TecNM  
**Objetivo:** Proporcionar especificaciones pedagógicamente viables, orientadas a validar dolores reales de campo, medir fricción en UX rural y entregar código funcional verifiable en GitHub.

---

# 📌 ISSUE #1.1: [UX Research & Campo] Auditoría de Dolores Económicos y Protocolo de Fricción Trimodal con 25 Productores

**Título para GitHub:**  
`[UX Research]: Auditoría de Dolores Económicos y Protocolo de Fricción Trimodal con 25 Productores Indígenas`

**Etiquetas:** `research`, `ux-friction`, `field-testing`, `indigenous-inclusion`, `drips-eligible`  
**Asignado a:** *Equipo de Estudiantes (Brigada de Campo y Validación Humana - 2 a 3 estudiantes)*  
**Tiempo estimado:** 2 semanas  
**Dificultad técnica:** Media / Formativa en Metodología de Investigación y UX

---

### 🎯 1. Objetivo del Estudiante
Acudir a parcelas y talleres artesanales en comunidades de la Mixteca Alta (Tlaxiaco, Amoltepec, Cuquila, Peñasco) para:
1. Cuantificar el **dolor económico real** provocado por los intermediarios ("coyotes").
2. Someter la interfaz móvil de *Raíz Mixteca* a pruebas directas con artesanas y campesinos (adultos mayores, hablantes de Tu'un Savi, personas no bancarizadas) para medir con cronómetro y métricas exactas los **puntos de fricción, confusión o rechazo**.

---

### 📋 2. Instrumento de Campo (Lo que el estudiante debe aplicar a cada productor)
El equipo debe llenar una ficha física o digital por cada una de las 25 personas evaluadas:

#### A. Ficha Socioeconómica y Dolor de Intermediación
* **Folio anónimo:** `UX-OAX-001` al `025`.
* **Comunidad y lengua:** Ej. San Cristóbal Amoltepec (Tu'un Savi / Español básico).
* **Producto analizado:** Ej. Rebozo de lana con grana cochinilla (o bulto de 60 kg café pergamino).
* **Tiempo de elaboración / cosecha:** Horas reales dedicadas.
* **Costo de insumos propios:** $ MXN gastados de su bolsa.
* **Precio pagado por el "Coyote":** $ MXN recibidos (¿se lo pagaron de contado o a crédito/fiado?).
* **Precio de reventa en Oaxaca/CDMX:** $ MXN (consultado en tiendas turísticas o internet).
* **Cálculo del Margen de Explotación:**  
  $$\text{Brecha \%} = \frac{\text{Precio Reventa} - \text{Pago Coyote}}{\text{Precio Reventa}} \times 100$$

#### B. Protocolo de Fricción de Usabilidad (Cronómetro y Observación sin Intervenir)
El estudiante le entrega el teléfono con la app abierta a la persona y le pide realizar 3 acciones puntuales **sin decirle dónde picarle**:

| Tarea Evaluada | Métrica a Medir | Criterio de Éxito | Punto de Fricción a Registrar |
| :--- | :--- | :--- | :--- |
| **Tarea 1: Audio en su lengua**<br>Grabar una nota de voz explicando el origen de su pieza o cosecha. | **Tiempo hasta iniciar grabación:**<br>Segundos desde la orden hasta pulsar el botón del micrófono. | ✅ < 10 segundos sin ayuda.<br>⚠️ > 10 s con titubeo.<br>❌ No identificó el botón. | ¿El ícono de micrófono fue intuitivo o le dio miedo presionar pensando que borraría algo? |
| **Tarea 2: Entendimiento del Pasaporte Digital**<br>Ver la pantalla de su producto con el sello del TecNM. | **Grado de asimilación:**<br>¿Cómo explica con sus palabras qué significa el sello y los datos? | ✅ Entendió que certifica que no es piratería.<br>❌ Pensó que era un cobro de impuestos o trámite burocrático. | ¿El texto tiene letra muy pequeña para ojos cansados? ¿El contraste de color funcionó bajo la luz del sol en el campo? |
| **Tarea 3: Identificación de la Etiqueta QR Física**<br>Ver la etiqueta impresa colgada de la muestra. | **Percepción de valor:**<br>¿Le gustaría coserla o colgarla a su costal/pieza? | ✅ Sí, para evitar imitaciones chinas.<br>❌ No, cree que estorba o que no le sirve. | ¿El tamaño de la etiqueta es adecuado para el telar o el costal de yute? |

---

### 📤 3. Entregable que el Estudiante debe subir en su Pull Request
El estudiante creará el archivo `docs/research/FIELD_UX_FRICTION_REPORT.md` conteniendo:
1. **Tabla Resumen de los 25 Casos:** Datos consolidados de intermediación y brecha económica.
2. **Matriz de Fricción UX:**
   - Tiempo promedio para grabar nota de voz.
   - % de productores que lograron navegar sin ayuda.
   - Los 3 principales errores cometidos por los usuarios en campo.
3. **Recomendaciones de Cambio Inmediato:** (Ejemplo: *"Agrandar 30% el botón de micrófono"*, *"Eliminar términos en inglés como 'Blockchain' o 'Mint' y sustituirlos por 'Sello Digital Comunitario'"*).

---
---

# 📌 ISSUE #1.2: [Frontend/PWA] Modo Parcela: Persistencia Offline en IndexedDB y Manejo de Conexión Rural

**Título para GitHub:**  
`[Frontend/PWA]: Modo Parcela Offline con Persistencia en IndexedDB y Sincronización Automática`

**Etiquetas:** `frontend`, `PWA`, `offline-first`, `indexedDB`, `typescript`  
**Asignado a:** *Equipo de Estudiantes (Brigada de Desarrollo Frontend - 2 estudiantes)*  
**Tiempo estimado:** 1 a 2 semanas  
**Dificultad técnica:** Media / Aplicación práctica de APIs de almacenamiento del navegador

---

### 🎯 1. Objetivo del Estudiante
En las parcelas altas de Tlaxiaco no hay señal 4G ni WiFi. El estudiante debe programar la lógica para que el formulario de registro (`RegisterCoffeeLotScreen.tsx`) detecte automáticamente la falta de internet y guarde los datos, fotografías y audios en el almacenamiento local del teléfono (**IndexedDB**), garantizando cero pérdida de información y sincronización al recuperar conectividad.

---

### 🛠️ 2. Tareas Técnicas Paso a Paso (Factibles y Concretas)

#### Paso A: Crear el servicio de persistencia en `/src/utils/offlineStorage.ts`
El estudiante debe implementar el acceso a `indexedDB` con la interfaz ya tipada en `src/types.ts`:

```typescript
import { PendingOfflineLot } from '../types';

const DB_NAME = 'RaizMixtecaDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_harvest_lots';

export async function openRaizDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. Guardar lote offline
export async function saveOfflineLot(lot: PendingOfflineLot): Promise<void> {
  const db = await openRaizDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(lot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 2. Obtener lotes pendientes
export async function getPendingOfflineLots(): Promise<PendingOfflineLot[]> {
  const db = await openRaizDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// 3. Eliminar lote ya sincronizado
export async function deleteOfflineLot(tempId: string): Promise<void> {
  const db = await openRaizDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(tempId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

#### Paso B: Integración en la pantalla de registro (`RegisterCoffeeLotScreen.tsx`)
1. Detectar si `!navigator.onLine`.
2. Si está offline:
   - Mostrar aviso rural visible:  
     `🏕️ Modo Parcela Activo (Sin Conexión). Tus fotos y audios se guardarán seguros en este teléfono.`
   - Al dar clic en "Registrar Lote", llamar a `saveOfflineLot()` con id temporal `LOCAL-${Date.now()}`.
   - Mostrar confirmación clara con sonido o vibración háptica.

---

### 📤 3. Entregable que el Estudiante debe subir en su Pull Request
El estudiante abrirá un PR incluyendo:
1. El archivo nuevo `/src/utils/offlineStorage.ts`.
2. La modificación a `RegisterCoffeeLotScreen.tsx`.
3. **Evidencia Visual Obligatoria (Video de 30s o GIF):**
   - Abrir DevTools en el navegador > Pestaña *Network* > Seleccionar **Offline**.
   - Registrar un lote con foto y nota de voz.
   - Presionar guardar y mostrar el mensaje de confirmación de Modo Parcela.
   - Recargar la página con `F5` sin internet y mostrar la pestaña *Application > Storage > IndexedDB* demostrando que los datos siguen ahí intactos.

---
---

# 📌 ISSUE #1.3: [Core/Architecture] Desacoplamiento de Lógica en Raíz Core (`/src/core`)

**Título para GitHub:**  
`[Core/Architecture]: Implementación de Raíz Core (Crypto, SyncEngine, FairTrade y SorobanAdapter)`

**Etiquetas:** `architecture`, `clean-code`, `domain-core`, `web3`, `drips-eligible`  
**Asignado a:** *Equipo de Estudiantes (Brigada de Arquitectura & Web3 - 2 estudiantes)*  
**Tiempo estimado:** 2 semanas  
**Dificultad técnica:** Media-Avanzada / Arquitectura de Software y Criptografía

---

### 🎯 1. Objetivo del Estudiante
Separar completamente la lógica de negocio y criptografía de los componentes visuales de React. Toda la lógica fundamental debe residir en `src/core/` para que sea reutilizable tanto en la PWA actual como en futuras apps nativas de Android (Kotlin) o bots comunitarios de WhatsApp.

### 🛠️ 2. Módulos Implementados en `/src/core/`:
- **`CryptoEngine` (`src/core/crypto/`):** Cálculo de identificadores únicos y hashes SHA-256 inmutables para fotos y testimonios de voz en Tu'un Savi.
- **`SyncEngine` (`src/core/sync/`):** Gestor de la cola de salida (Outbox) con observador de reconexión automática (`initAutoSync()`).
- **`FairTradeEngine` (`src/core/policy/`):** Reglas anti-coyote (alerta en precios de café < $90 MXN o artesanía < $250 MXN) y cálculo de regalías secundarias (8% para artesano, 2% para fondo comunal).
- **`SorobanAdapter` (`src/core/blockchain/`):** Adaptador agnóstico para invocar los contratos inteligentes de Stellar Testnet.

