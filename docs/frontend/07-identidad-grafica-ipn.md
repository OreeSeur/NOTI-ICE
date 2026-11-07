# Identidad gráfica IPN aplicada al frontend

Este documento resume los ajustes seguros aplicados al frontend para alinearlo con el Manual de Identidad Gráfica Institucional del Instituto Politécnico Nacional.

## Alcance de esta actualización

La actualización es intencionalmente mínima y segura. No modifica la estructura del layout, la sidebar, el topbar ni el comportamiento responsive.

Se aplicaron únicamente criterios visuales globales:

- Tipografía base institucional.
- Tokens de color institucional.
- Sustitución de acentos visuales internos por guinda IPN.
- Documentación de uso visual para próximas fases.

## Tipografía

La tipografía principal del portal queda definida como:

```css
font-family: "Noto Sans", ui-sans-serif, system-ui, sans-serif;
```

El manual establece Noto Sans como tipografía principal para materiales gráficos y digitales.

## Colores institucionales

Se definieron variables CSS para los colores institucionales principales:

```css
--ipn-guinda: #6f1d46;
--ipn-guinda-logo: #750946;
--ipn-gris: #636569;
--ipn-negro: #000000;
--ipn-blanco: #ffffff;
```

Uso recomendado:

| Uso | Color |
|---|---|
| Acentos principales del portal | `#6f1d46` |
| Aplicaciones relacionadas con logotipo | `#750946` |
| Texto secundario / soporte visual | `#636569` |
| Texto principal fuerte | `#000000` |
| Fondos claros | `#ffffff` |

## Reglas para el logotipo

El escudo/logotipo del IPN no debe deformarse, recolorearse ni recibir efectos visuales no autorizados. Se debe conservar su proporción y contraste.

En esta actualización no se modificó la estructura ni proporciones de los logotipos existentes.

## Decisión técnica

No se modificaron:

- `Layout.jsx`
- `Sidebar.jsx`
- `Topbar.jsx`
- Reglas de posicionamiento responsive
- Anchos, altos o comportamiento del menú lateral

Esto evita repetir el problema de recorte visual de la sidebar que apareció en una implementación anterior.

## Pendiente futuro

Cuando se cuente con recursos oficiales finales de imagen institucional, se puede evaluar:

- Sustituir imágenes por archivos oficiales optimizados.
- Agregar pleca institucional en vistas específicas de convocatorias o documentos oficiales.
- Revisar contraste AA/AAA en modo claro y modo oscuro.
