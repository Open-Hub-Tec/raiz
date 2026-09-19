# 📜 RAÍZ: BASE DE CONOCIMIENTO MAESTRA & GUÍA DE IMPLEMENTACIÓN
### **Ecosistema Abierto de Trazabilidad, Logística Inclusiva, Regalías Perpetuas y Pagos Comunitarios en Stellar**
**Institución Líder:** Instituto Tecnológico de Tlaxiaco (TecNM)  
**Protocolos Base:** Stellar Network, Soroban Smart Contracts, MicoPay Protocol, Drips Protocol, Bitso Bridge  
**Territorio Inicial:** Heroica Ciudad de Tlaxiaco y Municipios de la Mixteca Oaxaqueña (Yucuhiti, Peñasco, Juxtlahuaca)  
**Nodo de Expansión Regional:** Cordillera Apaneca-Ilamatepec y San Salvador, El Salvador  
**Fecha de Emisión:** Septiembre 2026 | Versión: 2.0 Definitiva  

---

## ÍNDICE GENERAL (TABLA DE CONTENIDOS PARA NOTION)
1. **Resumen Ejecutivo y Tesis del Proyecto**
2. **Arquitectura del Ecosistema en 5 Capas**
3. **Módulo Único de Registro Universal (Cero Módulos Separados)**
4. **El Chat Rural Raíz (Diseño Accesible & Audio Bilingüe)**
5. **Transformación del Coyote: Agente Logístico y Cajero Comunitario**
6. **Mecanismo de Regalías Perpetuas On-Chain (Mercado Secundario)**
7. **Protocolo MicoPay: Liquidación de Última Milla (Efectivo & SPEI)**
8. **Infraestructura Drips + GitHub: Modelo de Becas para Estudiantes**
9. **Análisis Regulatorio y Despliegue en El Salvador (San Salvador)**
10. **Estrategia para Tech Rebel (`techrebel.world/es`) y Convocatorias de Grants**
11. **Ruta Crítica de Implementación Técnica y de Campo (Paso a Paso)**
12. **Glosario y Especificación de Contratos Inteligentes en Soroban**

---

## 1. RESUMEN EJECUTIVO Y TESIS DEL PROYECTO

**Raíz** es una plataforma descentralizada de código abierto concebida para la Mixteca Alta que resuelve los tres problemas históricos de la economía indígena y campesina en Mesoamérica:
1. **La Brecha de Alfabetización y Conectividad:** La tecnología tradicional exige teclear datos complejos y contar con internet 4G continuo. Raíz permite que el campesino o artesana hable por notas de voz en español o su lengua originaria (*Tu'un Savi*), funcionando en modo offline en la parcela.
2. **El Monopolio y Fricción del Intermediario ("Coyote"):** En vez de intentar eliminar al coyote (lo cual fracasa porque él posee el transporte y el efectivo), se le integra a la plataforma como **Agente Logístico Comunitario y Cajero Móvil**, recibiendo comisiones transparentes garantizadas por contratos inteligentes.
3. **El Despojo del Valor en la Reventa:** Los artesanos y cafeticultores venden barato en el pueblo y ven cómo boutiques en el extranjero revenden sus obras a precios exorbitantes. Con Soroban, cada bien cuenta con un Pasaporte Digital que transfiere automáticamente un **10% de regalía perpetua** al artesano original cada vez que la pieza se revende.
4. **Desarrollo Comunitario con Drips:** Todo el código se mantiene como un **Bien Público Abierto**. Los estudiantes de ingeniería del Tec de Tlaxiaco cobran micro-subvenciones en USDC por cada *Issue* resuelto en GitHub mediante el protocolo **Drips**.

---

## 2. ARQUITECTURA DEL ECOSISTEMA EN 5 CAPAS

```
══════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAPA 0: FINANCIAMIENTO DE INGENIERÍA Y TALENTO LOCAL (DRIPS + GITHUB)
  • Fondo Comunitario (Grant SCF / Commons) ──► Smart Contract Drips (USDC)
  • GitHub Issues / Tareas abiertas ──► Estudiantes del Tec de Tlaxiaco programan
  • Aprobación de Pull Request ──► Streaming automático de fondos a la wallet del alumno
══════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAPA 1: INTERFAZ CONVERSACIONAL RURAL (CHAT RURAL ASISTIDO)
  • Micrófono con reconocimiento de voz en Español y Tu'un Savi (Mixteco)
  • Menú háptico simplificado de 4 botones de alto contraste para luz solar
  • Generación y lectura de Códigos QR seguros sin necesidad de internet en la montaña
══════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAPA 2: NÚCLEO DESACOPLADO (RAÍZ CORE - `src/core/`)
  • 🔄 SyncEngine: Cola Outbox persistente en IndexedDB con auto-sincronización al detectar señal
  • 🔐 CryptoEngine: Generación de Digest SHA-256 sobre audio testimonial en Tu'un Savi y fotos
  • ⚖️ FairTradeEngine: Barrera anti-coyotaje ($90 MXN café / $250 textil) y cálculo de regalías (8% + 2%)
  • 🌌 SorobanAdapter: Despachador agnóstico de contratos LotPassport y FairEscrow en Stellar
  • Visión por IA: Clasifica pureza de miel, densidad de tejido o secado de café en cama africana
  • Emisión del Pasaporte Digital con Hash único (Ej. MX-OAX-2026-912)
══════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAPA 3: NÚCLEO BLOCKCHAIN Y CONTRATOS SOROBAN (STELLAR LEDGER)
  • Contrato de Escrow: Retiene el pago del comprador global hasta la entrega
  • Contrato de Logística: Paga al Transportista/Coyote por flete verificado
  • Contrato de Regalías: Desvía 10% automático a la wallet de la artesana en cada reventa
  • Validación técnica y de origen por el Open Hub del Instituto Tecnológico de Tlaxiaco
══════════════════════════════════════════════════════════════════════════════════════════════════════════
  CAPA 4: COMERCIALIZACIÓN Y LIQUIDACIÓN FINANCIERA (MICOPAY)
  • Vitrina Comunitaria: Compradores de EE.UU. y el mundo compran en USDC / Tarjeta
  • Liquidación A (Efectivo en mano): En centro de acopio o con el Agente Logístico en parcela
  • Liquidación B (SPEI Automático): Rampa Bitso directa a Tarjeta Bienestar o Banco Azteca
══════════════════════════════════════════════════════════════════════════════════════════════════════════
```

---

## 3. MÓDULO ÚNICO DE REGISTRO UNIVERSAL (CERO MÓDULOS SEPARADOS)

### ¿Por qué NO dividir la plataforma por productos?
Las familias de la Mixteca son multi-productivas por naturaleza. La misma familia que cosecha café en temporada alta, cuida colmenas de miel en primavera, elabora tenates de palma y teje huipiles de telar de cintura en las tardes.
Crear pantallas o aplicaciones separadas genera confusión, satura el teléfono del usuario y rompe la experiencia.

### Estructura Universal del Registro:
Todo producto pasa por los mismos 4 pasos dentro del Chat Rural:

1. **Declaración Asistida:** El campesino dice por audio: *"Tengo 10 bultos de café pergamino lavado"* o *"Terminé 3 rebozos de telar con tinte de grana cochinilla"*.
2. **Evidencia Fotográfica / IA:** La cámara analiza la textura (grano, hilado, viscosidad de la miel o cocción del barro).
3. **Parámetros de Origen:** Se registran datos universales:
   * Nombre de la familia productora / taller artesanal.
   * Comunidad / Paraje / Coordenadas GPS.
   * Volumen / Peso (kg) o Número de piezas.
   * Precio base justo solicitado por el productor.
4. **Acuñación del Pasaporte Digital:** Se crea el token inmutable en la red Stellar que viaja con el producto físico mediante una etiqueta con código QR.

---

## 4. EL CHAT RURAL ASISTIDO: DISEÑO ACCESIBLE Y AUDIO BILINGÜE

### Principios de Diseño para el Campo:
* **Cero contraseñas alfanuméricas:** Autenticación por biometría (huella dactilar) o código NIP de 4 números.
* **Modo Fuera de Línea (Offline-First):** La aplicación firma las transacciones y genera los recibos localmente en el dispositivo. Cuando el productor baja al pueblo con señal, la sincronización se realiza en 2 segundos.
* **Voz en Tu’un Savi y Español:**
  * Para los abuelos que no leen, el botón de bocina reproduce: *"Tu lote de café fue aprobado por el laboratorio. Tienes listo un cobro de diez mil pesos en la cooperativa"*.
* **Paleta de Alto Contraste:** Fondos oscuros con elementos amarillos y verdes brillantes para permitir una perfecta visibilidad bajo el sol intenso de la parcela.

---

## 5. TRANSFORMACIÓN DEL COYOTE: AGENTE LOGÍSTICO Y CAJERO COMUNITARIO

Este es el pilar de innovación socioeconómica más disruptivo del proyecto:

### El Problema Tradicional:
El intermediario privado ("coyote") abusa porque tiene el monopolio de dos activos escasos en la sierra: **la camioneta de carga y el dinero en efectivo**. Intentar erradicarlo solo provoca que las comunidades se queden sin transporte.

### La Solución con Soroban:
El coyote se descarga la aplicación y se registra como **"Agente Logístico Certificado"**:

1. **Flete Transparente y Garantizado:**  
   * El Chat Rural le notifica: *"Lote disponible en Yucuhiti: 15 costales de café. Tarifa de transporte asignada: $1,200 MXN"*.
   * El dinero del flete ya está retenido en el contrato inteligente. El transportista sabe que no le van a regatear.
   * Recoge el producto, lo entrega en el centro de acopio de Tlaxiaco, el encargado escanea el QR de recepción y el contrato le libera su ganancia al instante.
2. **El Coyote como "Cajero Móvil MicoPay":**  
   * Si el transportista viaja con efectivo, puede liquidar al campesino directamente en la parcela:
   * El campesino le muestra su QR de cobro en MicoPay por $5,000 pesos.
   * El coyote le entrega los $5,000 pesos en billetes.
   * El campesino le transfiere los $250 USDC equivalentes desde su app al coyote, más una comisión autorizada por servicio de retiro (ej. 1%).
   * **El coyote gana dinero legítimo sin abusar del precio de la cosecha.**

---

## 6. MECANISMO DE REGALÍAS PERPETUAS ON-CHAIN (MERCADO SECUNDARIO)

### El Problema del Arte Indígena:
Una artesana vende un huipil tradicional a un comprador intermediario por **$1,500 MXN**. Seis meses después, ese mismo huipil es vendido en una galería o tienda de diseño en Polanco o Los Ángeles por **$12,000 MXN**. La artesana nunca se entera ni recibe un centavo de esa plusvalía.

### La Solución en Soroban (Stellar):
El Pasaporte Digital de cada pieza artesanal y lote especial incorpora un estándar de **Royalties Secundarios Inmutables**:

```
[VENTA PRIMARIA]
Artesana en Tlaxiaco ── Vende por $2,000 MXN ──► Comprador A
(El contrato registra la llave pública de la artesana como Beneficiaria Perpetua)

[VENTA SECUNDARIA (2 años después en la Vitrina Comunitaria)]
Comprador A ── Revende la pieza en $10,000 MXN ──► Comprador B (Alemania)
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       $9,000 MXN al Vendedor          $1,000 MXN (10% de Regalía)
                                    Transferencia automática en USDC
                                               │
                                               ▼
                                  Billetera MicoPay de la Artesana
```

El Chat Rural notifica con audio a la artesana:  
> 🔊 *"Buenas tardes, Doña Carmen. Su huipil Lote #88 se acaba de revender. Se han depositado $1,000 pesos de regalías en su cuenta MicoPay."*

---

## 7. PROTOCOLO MICOPAY: LIQUIDACIÓN DE ÚLTIMA MILLA (EFECTIVO & SPEI)

MicoPay es el protocolo financiero que convierte los dólares digitales (USDC en Stellar) en billetes físicos en mano para el campesino con **cero comisiones abusivas**.

### Canales de Salida (Off-Ramp):

1. **Canal A: Cobro en Efectivo en el Centro de Acopio / Cooperativa**
   * El productor abre su app MicoPay y presiona **"Cobrar en Efectivo"**.
   * Se genera un Código QR seguro con el monto y firma criptográfica.
   * El encargado de la cooperativa en Tlaxiaco escanea el QR con su terminal.
   * El contrato transfiere los USDC a la cooperativa y el cajero le entrega los billetes completos en mano al productor. **Comisión para el productor: 0.0%**.
2. **Canal B: Transferencia Directa por SPEI (Vía Rampa Bitso Business)**
   * Si el productor o sus hijos tienen cuenta bancaria o tarjeta social:
   * Ingresa su número CLABE o tarjeta de 16 dígitos.
   * La API de Bitso cambia los USDC a Pesos Mexicanos (MXN) y liquida por SPEI en 3 segundos a:
     * Tarjeta del Bienestar
     * Banco Azteca (Elektra)
     * Spin by OXXO / Bancoppel
3. **Canal C: Retiro con el Agente Logístico Móvil (En la parcela)**
   * Liquidación cara a cara con el transportista local mediante escaneo P2P.

---

## 8. INFRAESTRUCTURA DRIPS + GITHUB: MODELO DE BECAS PARA ESTUDIANTES

### El Modelo "Learn, Build and Earn" Comunitario:
Para que la plataforma sea un **Bien Público Sostenible**, el desarrollo técnico no se delega a consultoras externas; se ejecuta en el **Tecnológico Nacional de México - Campus Tlaxiaco**.

```
[FONDO DEL GRANT (SCF / COMMONS)]
              │
              ▼
[SMART CONTRACT DRIPS EN SOROBAN] (Bolsa de fondos en USDC)
              │
              ▼
┌───────────────────────── REPOSITORIO GITHUB ─────────────────────────┐
│ El Coordinador/Profesor crea los Issues técnicos con recompensa:     │
│ • Issue #15: "Agregar audio en dialecto Tu'un Savi de Peñasco" [50$] │
│ • Issue #22: "Optimizar compresión de fotos offline" [75$]           │
│ • Issue #31: "Contrato Soroban de cálculo de regalías 10%" [120$]    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
[ESTUDIANTE PROGRAMADOR ENVÍA PULL REQUEST (PR)]
                                   │
                                   ▼
[REVISIÓN DE CÓDIGO Y MERGE POR EL DOCENTE TUTOR]
                                   │
                                   ▼
[DRIPS TRANSMITE AUTOMÁTICAMENTE EL PAGO EN USDC A LA WALLET DEL ALUMNO]
```

* **Impacto Educativo:** Cada estudiante que resuelve un Issue acredita horas oficiales de **Servicio Social o Residencia Profesional**, y recibe ingresos reales directos a su cuenta para solventar sus estudios universitarios.

---

## 9. ANÁLISIS REGULATORIO Y DESPLIEGUE EN EL SALVADOR (SAN SALVADOR)

### ¿Por qué El Salvador es el territorio ideal para expandir MicoPay?

1. **Marco Legal Plenamente Habilitado:**  
   * **Ley de Emisión de Activos Digitales (LEAD):** La Comisión Nacional de Activos Digitales (CNAD) regula expresamente todas las plataformas blockchain, contratos inteligentes y stablecoins no basadas en Bitcoin.
   * **USDC Aprobado:** La CNAD ha emitido dictamen oficial de *No Objeción* para la libre comercialización y custodia de USDC.
   * **Exención Fiscal:** Proyectos registrados bajo la LEAD gozan del **0% de Impuesto sobre la Renta (ISR), 0% de Ganancias de Capital y 0% de impuestos locales**.
2. **Economía Naturalmente Dolarizada:**  
   * El Salvador utiliza el dólar estadounidense (USD) desde 2001. Al operar MicoPay con **USDC en Stellar**, no existe riesgo de tipo de cambio: 1 USDC = 1 Dólar Físico.
3. **Casos de Uso Inmediatos en San Salvador:**  
   * **Cafeticultores de la Cordillera Apaneca-Ilamatepec (Santa Ana):** Variedades Pacamara y Bourbon de alta gama que sufren por intermediarios locales.
   * **Artesanos de La Palma (Chalatenango) e Ilobasco (Cabañas):** Venta directa a la diáspora salvadoreña en Estados Unidos mediante cobro en USDC y retiro de dólares en cooperativas de ahorro y crédito (FEDECACES).

---

## 10. ESTRATEGIA PARA TECH REBEL Y CONVOCATORIAS DE GRANTS

### A. Para Tech Rebel (`techrebel.world/es`):
* **Posicionamiento:** *"Estudio de Producto y Eliminación de Fricción Humana en el Sector Rural Indígena"*.
* **Por qué encaja:** Tech Rebel ya apoya iniciativas en Tlaxiaco (como *ReciTlax*) y su programa *Alebrije*. El Chat Rural es la solución definitiva al problema de adopción de Web3 en América Latina.
* **Lo que se solicita a Tech Rebel:** Liderazgo de producto fraccional para optimizar la interfaz conversacional y asesoría para levantar rondas de financiamiento internacional.

### B. Para Funding the Commons (San Salvador 2026):
* **Track:** `RealFi & Public Goods Infrastructure`.
* **Argumento Ganador:** MicoPay es un bien público abierto que conecta a las comunidades agrícolas con la economía global usando **Drips** para financiar el talento local de código abierto.
* **Tamaño del Piloto:** 25 a 30 productores, 3 transportistas certificados y 1 cooperativa de acopio.

### C. Para la Stellar Community Fund (SCF):
* **Track:** `Build Award - Real World Assets & Financial Inclusion`.
* **Argumento Ganador:** Demostración en vivo de contratos inteligentes en Soroban ejecutando micro-liquidaciones de cosechas, pagos logísticos P2P y regalías secundarias con comisiones de red de fracciones de centavo ($0.00001 USD).

---

## 11. RUTA CRÍTICA DE IMPLEMENTACIÓN TÉCNICA Y DE CAMPO (PASO A PASO)

```
FASE 1: CONSOLIDACIÓN TÉCNICA Y REPOSITORIO (Semanas 1 - 4)
├── Auditar y blindar el componente ChatScreen.tsx en React/Tailwind.
├── Desplegar el contrato inteligente de Logística y Regalías en Soroban Testnet.
├── Configurar el repositorio público en GitHub con etiquetas de Drips (bounties).
└── Integrar la rampa de prueba de Bitso para retiros SPEI.

FASE 2: PILOTO TERRITORIAL EN TLAXIACO (Semanas 5 - 10)
├── Taller de inducción con 25 productores de café y artesanas de Yucuhiti y Peñasco.
├── Capacitación a 3 transportistas locales ("coyotes aliados") con la app de Agente Logístico.
├── Instalación del nodo cajero en la cooperativa de Tlaxiaco.
└── Ejecución de las primeras 50 transacciones reales de café y artesanías con cobro QR.

FASE 3: EVALUACIÓN Y DESPLIEGUE EN SAN SALVADOR (Semanas 11 - 16)
├── Presentación de resultados y métricas del piloto ante Tech Rebel y jurados de Grants.
├── Vinculación con 1 cooperativa cafetalera en Santa Ana, El Salvador.
├── Adaptación de la rampa de retiro en efectivo para cooperativas salvadoreñas (USD).
└── Activación formal de las regalías secundarias por reventas internacionales.
```

---

## 12. GLOSARIO Y ESPECIFICACIÓN DE SMART CONTRACTS (SOROBAN)

* **`universal_registry_contract`:** Almacena el hash inmutable, tipo de bien (café, miel, textil, etc.), coordenadas de origen y la llave pública del productor original.
* **`logistics_escrow_contract`:** Bloquea los fondos del comprador y la tarifa de transporte asignada. Libera el pago al productor y la comisión al transportista en el instante en que el centro de acopio confirma la recepción física.
* **`secondary_royalty_contract`:** Intercepta cualquier transferencia de propiedad en la Vitrina Comunitaria y deduce automáticamente el 10% del importe para transferirlo a la billetera original del artesano.
* **`drips_stream_pool`:** Contrato de dispersión de fondos que alimenta las cuentas Stellar de los estudiantes del Tec conforme sus PRs son aprobados en GitHub.

---

*Base de Conocimiento oficial desarrollada por y para el equipo del Instituto Tecnológico de Tlaxiaco.*  
*Archivo fuente disponible en el repositorio central: `/CHAT_RURAL_KNOWLEDGE_BASE.md`*
