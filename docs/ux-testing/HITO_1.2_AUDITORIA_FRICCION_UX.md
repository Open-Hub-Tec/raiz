# 📱 Hito 1.2: Pruebas de Usabilidad UX con Prototipo Accesible para Adultos Mayores
**Repositorio:** `Open-Hub-Tec/raiz`  
**Institución:** Instituto Tecnológico de Tlaxiaco (TecNM) – Carrera de Ingeniería en Sistemas Computacionales  
**Asignatura:** Fundamentos de Ingeniería de Software (SCC-1007) – Asesor: Ing. José Alfredo Román Cruz  
**Hito Drips / Roadmap:** Issue #2 – UX Milestone 1.2 (Validado & Resuelto vía PR #30)  
**Documento Oficial:** [`docs/ux-testing/HITO_1.2_PRUEBAS_USABILIDAD.pdf`](./HITO_1.2_PRUEBAS_USABILIDAD.pdf)

---

## 👥 Equipos de Evaluación de Usabilidad
* **Equipo A (San José Xochixtlán - Textil Triqui):** Castro Rodríguez Charlie Jared, Reyez Hernández Dulce Maetzy, Brayan Armando Pérez González, José Manuel Hernández Paz (5º Semestre Grupo B). Participante: Doña Reyna (56 años).
* **Equipo E (San Juan Mixtepec - Palma):** Jazlynn Barrios Velasco, Isaías Brayan López Dominguez, Rafael Ayala Coronel, Alex Antonio Victoria Vasquez (7º Semestre Grupo 7US). Participante: Doña Juana (68 años). Detalle: [`docs/ux-testing/auditoria_ux_artesanas_palma_mixtepec.md`](./auditoria_ux_artesanas_palma_mixtepec.md).
* **Dispositivo de Prueba:** Teléfono móvil estándar Android simulando condiciones de campo rural bajo luz solar directa.

---

## 🧪 Metodología y Ejecución de Tareas

| Tarea Evaluada | Tiempo Registrado | ¿Requirió Ayuda? | Observaciones y Fricción Detectada |
| :--- | :---: | :---: | :--- |
| **Tarea 1: Buscar y reconocer su huipil** | **22 segundos** | **No** | Pequeña vacilación inicial al revisar las opciones del menú antes de pulsar la sección del producto. |
| **Tarea 2: Revisar información e historia del huipil** | **41 segundos** | **No** | Comprendió los datos principales, pero tuvo dificultad para leer tipografías secundarias de menor tamaño. Buscó prioritariamente quién elaboró la prenda y su comunidad. |
| **Tarea 3: Identificación mediante Código QR** | **9 segundos** | **No** | **Fricción mínima / Instantáneo.** Comprendió de inmediato que el QR vincula el huipil físico con su ficha digital y sugirió colocarlo como etiqueta colgante (*hang-tag*). |

---

## 🔍 Diagnóstico de los 3 Puntos de Fricción Críticos

### 1. Dificultad para identificar opciones en el menú
* **Problema:** En la primera tarea se observó una duda de varios segundos buscando dónde comenzar. Los íconos abstractos o menús multinivel generan incertidumbre en usuarios rurales mayores.
* **Mejora Aplicada en Raíz:** 
  * Botones grandes (>48px táctil y hasta 112px en Modo Abuelo) con texto descriptivo explícito (*"Ver mi huipil"*, *"Mi historia"*, *"Información"*).
  * Principio *Zero-Typing*: Navegación guiada por voz en Mixteco (Tu'un Savi) y español.

### 2. Tamaño de letra y contraste visual
* **Problema:** Los textos complementarios (fechas, especificaciones técnicas) provocaron fatiga visual y lectura forzada en pantalla de 5-6 pulgadas.
* **Mejora Aplicada en Raíz:**
  * Modo de Alto Contraste (fondos claros contrastados con texto oscuro `slate-900` / `stone-800`).
  * Aumento del tamaño de fuente en toda la ficha técnica y espaciado generoso para evitar toques accidentales.

### 3. Jerarquía Visual: Lo Comunitario Primero
* **Problema:** La artesana se enfoca en verificar su nombre, su comunidad y su técnica antes de ver datos contables o hashes criptográficos.
* **Mejora Aplicada en Raíz:**
  * La cabecera del Pasaporte Digital coloca en primer término:
    1. Fotografía de la artesana y comunidad (**San José Xochixtlán, Oaxaca**).
    2. Técnica ancestral (**Telar de Cintura tradicional**).
    3. Significado cultural de la iconografía (venados, flores, montañas).
  * Los detalles técnicos y de smart contract (Stellar hash, EUDR, SCAA) se organizan en tarjetas desplegables ordenadas.

---

## 📈 Matriz de Auditoría de Fricción Digital

| Factor Evaluado | Comportamiento Observado | Resolución en Arquitectura To-Be |
| :--- | :--- | :--- |
| **Navegación** | Ligera duda en búsqueda inicial | Menú de tarjeta única y Modo Abuelo simplificado |
| **Legibilidad** | Dificultad en texto secundario | Tipografía base aumentada y modo macro |
| **Identidad Cultural** | Interés prioritario en autoría | Ficha de origen destacada con audio en lengua materna |
| **Anclaje QR** | Aceptación inmediata en 9 seg | Generación vectorial de etiquetas Hang-Tag ISO/IEC 18004 listas para imprimir en papel kraft |
| **Conectividad** | Zona rural sin señal 4G constante | Buffer Offline-First con IndexedDB y sincronización automática |

---

## 🏆 Conclusión
La prueba demostró que el diseño centrado en el productor indígena funciona con alta tasa de éxito (100% de tareas completadas sin asistencia). Las mejoras de accesibilidad recomendadas por los estudiantes del TecNM han sido formalmente incorporadas en el sistema de componentes de Raíz.
