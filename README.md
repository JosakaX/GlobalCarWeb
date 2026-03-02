# Global Car Web

Plataforma premium para el concesionario de vehículos **Global Car**. Diseñada para ofrecer una experiencia en línea de alta gama (estética "Glassmorphism") donde los clientes pueden explorar el inventario de vehículos disponibles o en tránsito, dejar "Me Gusta" en los carros de su preferencia (para convertirlos en destacados) y visualizar planes de compra programada.

El sistema también cuenta con un **Panel de Administración Privado** para la gestión total (subir, editar y eliminar) del catálogo de carros.

## 🚀 Tecnologías y Características Principales

- **Backend:** Python + Flask (Ligero, rápido y seguro) integrado con base de datos en la nube.
- **Base de Datos & Almacenamiento:** Supabase (PostgreSQL para datos y Supabase Storage para alojar fotos en la nube).
- **Frontend UI/UX Premium:** HTML5, Tailwind CSS (inyectado vía CDN para estilos modernos, diseño responsive, y glassmorphism), y JavaScript Vanilla.
- **Navegación Inteligente:** Barra de navegación superior (Navbar) con efectos dinámicos de encogimiento al hacer scroll, transparente y con desenfoque de fondo.
- **Asistente Virtual (Chatbot FAQ):** Integración de un Chatbot flotante interactivo (estilo acordeón) 100% responsivo, con un diseño de UI moderno que permite a los usuarios consultar dudas frecuentes (financiamiento, requisitos, ubicación) y los conecta directamente vía WhatsApp con el área de soporte con un solo toque. Con la implementación avanzada de _Custom Scrollbars_ siempre visibles en toda la interfaz interactiva.
- **Visualización de Vehículos:** Implementación de carruseles interactivos de alto rendimiento tanto en el Home Page como en el inventario con soporte para táctil (swipe en móviles) y teclado.
- **Seguridad:** Autenticación por Sesiones y protecciones HTTP completas.

---

## 🔒 Seguridad (Mejores Prácticas)

Para proteger esta aplicación en el entorno de producción, nos hemos asegurado de realizar lo siguiente:

1. **Variables de Entorno Secretas:** La clave del panel administrador y las llaves de desarrollo de la base de datos están fuertemente protegidas en el archivo `.env` (excluido siempre desde el control de versiones local con Git).
2. **Autenticación en Servidor (Rutas protegidas):** Todas las APIs de borrado y carga de carros están blindadas con el decorador `@api_login_required`. Es decir, es imposible enviar una "petición fantasma" al servidor para alterar la base de datos sin estar logeado realmente en el sistema.
3. **Hide Login (Ruta Oscura):** No existen botones públicos apuntando a "/admin/login" para disuadir fuerza bruta.
4. **Validadores HTML:** Cabeceras inyectadas con Python (Headers) asegurando políticas como `X-Content-Type-Options: nosniff` y bloqueadores Anti-XSS (`X-XSS-Protection: 1; mode=block`).

---

## 🔍 SEO Configurado (Optimización para Google)

El sitio cuenta con las _Meta-Etiquetas Universales_ integradas en su código base (`base.html`), asegurando rastreo orgánico e indexación rápida:

- **Títulos dinámicos.**
- **Palabras claves (Keywords) inyectadas:** "venta de vehiculos, concesionario maracay, carros importados, compra programada".
- **Atributos de Open Graph (`og:`):** Al compartir el enlace en WhatsApp, Facebook, o Instagram, se despliega una tarjeta profesional enriquecida con la miniatura y descripción del portal.

---

## 🛠️ Despliegue a Producción (Deployment Steps)

Una vez que el proyecto vaya a salir al público (Producción), se deberán seguir estos pasos desde la plataforma en la nube (ej. Render, Heroku o VPS de preferencia):

1. Definir/Cargar todas las **Environment Variables** (las mismas del archivo `.env`) dentro del servidor web, esto incluye:
   - `SUPABASE_URL` y `SUPABASE_KEY`
   - `ADMIN_USER` y `ADMIN_PASSWORD` (Las contraseñas maestras)
   - `FLASK_SECRET_KEY` (Una frase aleatoria muy compleja para encriptar las cookies de seguridad).
2. Forzar conexión segura **HTTPS** y descomentar la regla de `Strict-Transport-Security` en `app.py`.
3. Adquirir y apuntar los DNS de _globalcarvzla.com_ (u otro dominio correspondiente) al servidor asignado.
4. **Archivos Locales Excluidos:** Bajo ninguna circunstancia se debe subir el archivo `.env` al servidor; las variables de entorno se copian directamente en las configuraciones del hosting. Así mismo, los siguientes archivos fueron exclusivamente creados para pruebas y ensamblaje local y **NO DEBEN** enviarse a producción:
   - `populate_db.py` (Script de inyección de datos falsos inicial).
   - `analyze_colors.py` (Script de análisis de colores para la paleta).
   - `viewer.html` y `ver_logo.html` (Visores temporales para calibrar los logos Vectoriales en desarrollo).

## ©️ 2026 Global Car - RM Motors VIP

**Desarrollado y Diseñado por: JosakaX (Lead Developer & Architect)**  
🤖 \_Desarrollo potenciado y co-creado con Asistencia de Inteligencia Artificial (AI-Driven Development) abrazando las herramientas tecnológicas del futuro.\*

> \_Construido con altos estándares de calidad, uniendo un diseño frontend premium (Glassmorphism) con la robustez y seguridad de un backend moderno (Python/Flask + Supabase) para transformar la comercialización de vehículos en la región.\*

Desarrollo corporativo diseñado a medida, reservado exclusivamente para uso interno de la marca en Maracay, Edo. Aragua.
