# 📱 Auditoría de Fricción y Pruebas de Usabilidad UX en Campo: Sector Palma - Mixteca Oaxaqueña

**Repositorio:** `Open-Hub-Tec/raiz`  
**Institución:** Tecnológico Nacional de México | Instituto Tecnológico de Tlaxiaco  
**Materia:** Gestión de Proyectos de Software 2026 – Grupo: 7US  
**Fecha:** Tlaxiaco / San Juan Mixtepec, Oax., 30 de Septiembre de 2026  
**Issue Relacionado:** #2 – `[UX Milestone 1.2]: Elder-Accessible Interactive Prototype Usability Testing with 50 Indigenous Artisans in the Field`

---

## 👥 Equipo Evaluador
* **23620209** – Jazlynn Barrios Velasco
* **23620031** – Isaías Brayan López Dominguez
* **23620203** – Rafael Ayala Coronel
* **23620281** – Alex Antonio Victoria Vasquez

---

## 📋 Ficha de Usabilidad y Fricción en Campo: [TEST #02 - San Juan Mixtepec]

### 1. Perfil del Participante
- **Comunidad:** San Juan Mixtepec, Mixteca Alta, Oaxaca
- **Artesana Evaluada:** Doña Juana (68 años, artesana tejedora de palma)
- **Actividad:** Tejido a mano de palma (*Brahea dulcis*) para sombreros finos, tenates y canastas utilitarias.
- **Lengua Materna:** Tu'un Savi (Mixteco) - Habla español básico.
- **Dispositivo Utilizado:** Smartphone Android (pantalla 6.5 pulgadas), probado bajo condiciones reales de luz exterior (patio del taller artesanal).
- **Experiencia Tecnológica Previa:** Teléfono analógico de teclas básicas para llamadas familiares; interacción táctil casi nula; utiliza notas de voz en WhatsApp con asistencia esporádica de sus nietos.

---

### 2. Resultados en Vivo de la Prueba de Usabilidad (Cronómetro en Mano)

| Tarea Evaluada | Tiempo Registrado | ¿Requirió Ayuda? | Fricción y Reacciones Observadas |
| :--- | :---: | :---: | :--- |
| **Tarea 1: Grabación de Nota de Voz**<br>*(Pulsar micrófono y narrar 30s de su trabajo en Tu'un Savi)* | **16 segundos** | ⚠️ Vaciló al inicio | Observó la pantalla fijamente durante 9 segundos con timidez. Preguntó: *¿Si le aprieto aquí no se me borra nada del teléfono?*. Una vez transmitida confianza, pulsó el botón y narró con fluidez en Mixteco (*Tu'un Savi*) el proceso de secado y blanqueado de la palma al sol. |
| **Tarea 2: Inspección del Pasaporte Digital**<br>*(Revisión de sello universitario TecNM y origen)* | **48 segundos** | ❌ Confusión temporal | El reflejo solar en el patio dificultó la lectura de textos pequeños en color gris claro. Inicialmente temió que el sello fuera un trámite fiscal o cobro de impuestos (*"¿Esto no es para que el gobierno me quite dinero?"*). Al explicarle que el sello certifica que su sombrero es auténtico y no plástico chino, su rostro cambió positivamente: *"Ah, entonces esto nos defiende del coyote"*. |
| **Tarea 3: Etiqueta Física Colgante QR**<br>*(Muestra física en papel kraft / cartulina)* | **5 segundos** | ✅ Comprensión inmediata | **Fricción nula.** Tomó la etiqueta con sus manos y comprendió al instante: *"Si le amarramos este cartoncito al sombrero con un mecatito, quien lo compre en la ciudad sabrá que yo lo tejí en Mixtepec y no en una fábrica"*. |

---

### 3. Los 3 Puntos Críticos de Fricción Detectados

1. **Tecnofobia y Temor al Error Involuntario:**
   Las artesanas mayores experimentan parálisis o desconfianza inicial al tocar botones digitales porque temen dañar el dispositivo móvil o borrar información sensible. Requieren confirmaciones visuales no amenazantes y botones táctiles amplios.

2. **Legibilidad Bajo Luz Solar Directa (Reflejo en Taller):**
   El trabajo de la palma se realiza a plena luz del día en corredores y patios de tierra. Las tipografías delgadas (<14px) o con bajo contraste (tonos grises) se vuelven invisibles ante el resplandor solar y el desgaste visual natural de las artesanas (cataratas tempranas y presbicia).

3. **Miedo a Términos Institucionales o Técnicos:**
   Palabras como *"Blockchain"*, *"Hash"*, *"Escrow"* o sellos institucionales ambiguos generan recelo y asociaciones con impuestos gubernamentales. La interfaz debe priorizar conceptos comprensibles como *"Sello de la Comunidad"*, *"Artesanía Certificada"* y *"Voz de la Creadora"*.

---

### 4. Propuesta de Correcciones UX Aplicadas (Modo Abuelo / Elder Mode)

* **Micrófono Prominente con Animación de Pulso:**
  Incrementar el área táctil del botón de micrófono a un mínimo de 64x64px, con icono verde esmeralda de alto contraste y un aro pulsante suave que transmita que es seguro y fácil de usar.
* **Paleta de Alto Contraste para Exteriores:**
  Establecer fondos claros limpios combinados con texto verde oscuro (`#032517`) o negro carbón (`#0f172a`), eliminando degradados o textos secundarios grises claros en pantallas de campo.
* **Prioridad a la Identidad y la Voz:**
  Colocar en el primer nivel visual la foto de la artesana, su comunidad (**San Juan Mixtepec**) y el botón para reproducir el testimonio oral en Tu'un Savi, relegando los identificadores criptográficos a menús desplegables secundarios.
* **Etiqueta Hang-Tag QR de Gran Formato:**
  Diseñar la etiqueta física de colgar con dimensiones mínimas de 7x10 cm en papel kraft resistente a la intemperie, facilitando su sujeción a sombreros y tenates con hilo de ixtle.
