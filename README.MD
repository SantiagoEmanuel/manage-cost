# Sistema de Gestión de Gastos Personales y Compartidos — Instrucciones de Desarrollo

El objetivo es desarrollar una aplicación moderna, escalable y segura para la gestión de gastos personales y compartidos del hogar.

Respetar la arquitectura con estándares reales de industria.

---

# Objetivo del sistema

La aplicación debe permitir:

- Gestión de gastos personales.
- Gestión de gastos compartidos en grupos.
- Registro de deudas entre integrantes.
- Visualización clara de balances.
- Transparencia de movimientos.
- Persistencia de historial.
- Manejo seguro de autenticación y sesiones.
- Escalabilidad futura.

Inspiración:

- Splitwise
- Tricount
- Wallet
- YNAB
- Fintonic

Pero con enfoque:

- minimalista
- rápido
- moderno
- mobile-first
- UX extremadamente limpia

---

# Stack tecnológico obligatorio

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- TanStack Query
- Zustand
- React Router V7
- Zod -> Paquete interno en Packages evitando repetir tipado entre apps
- React Hook Form

## Backend

- Node.js
- Express
- TypeScript
- Turso
- Drizzle ORM

## Autenticación

Implementar autenticación propia usando:

- JsonWebToken (JWT)
- bcrypt
- cookies httpOnly
- refresh token rotation
- access token corto
- refresh token persistente
- invalidación de sesiones
- renovación automática de sesión

NO usar Firebase Auth.
NO usar Clerk.
NO usar Supabase Auth.

Se debe entender y controlar toda la lógica de autenticación.

---

# Reglas críticas de autenticación

## Inicio de sesión

Cada vez que el usuario haga login:

- generar nuevo access token
- generar nuevo refresh token
- invalidar refresh token anterior
- persistir el nuevo refresh token en base de datos

## Persistencia de sesión

La sesión debe mantenerse activa automáticamente mientras el refresh token sea válido.

## Seguridad obligatoria

Implementar:

- hash de contraseñas con bcrypt
- cookies httpOnly
- secure cookies
- sameSite
- rate limiting (5)
- protección CSRF
- validación exhaustiva
- sanitización
- helmet
- CORS seguro
- invalidación de tokens robados
- detección básica de reuse attack

---

# Funcionalidades principales

# 1. Usuarios

Cada usuario debe poder:

- registrarse
- iniciar sesión
- cerrar sesión
- editar perfil
- cambiar contraseña (mediante verificación por correo)
- subir avatar
- configurar moneda
- configurar idioma
- configurar zona horaria

---

# 2. Gastos personales

El usuario debe poder:

- registrar gastos personales
- categorizar gastos
- agregar descripción
- agregar monto
- elegir moneda
- elegir método de pago
- agregar fecha
- agregar notas
- adjuntar comprobantes

Métodos de pago:

- efectivo
- débito
- crédito
- transferencia
- billetera virtual

---

# 3. Tarjetas

El sistema debe soportar:

## Débito

- registro simple de movimiento

## Crédito

- cuotas
- cierre
- vencimiento
- resumen mensual
- deuda pendiente
- cálculo automático de cuotas futuras

Ejemplo:

Compra:
$120.000
6 cuotas

El sistema debe:

- dividir automáticamente
- generar cuotas futuras
- mostrar deuda pendiente
- permitir seguimiento mensual

---

# 4. Grupos compartidos

Los usuarios deben poder crear grupos como:

- Casa
- Viaje
- Pareja
- Amigos
- Oficina

Cada grupo tendrá:

- miembros
- gastos
- balances
- historial
- deudas
- liquidaciones

---

# 5. División de gastos

Permitir:

## División equitativa

Ejemplo:
$40.000 entre 4 personas.

## División personalizada

Ejemplo:

- uno paga 70%
- otro 30%

## División por montos

Ejemplo:

- Juan: $5000
- Pedro: $3000

---

# 6. Sistema de deudas

Ejemplo:

Santiago paga:
$50.000

Grupo:
5 personas

Entonces:
cada integrante adeuda su parte a Santiago.

El sistema debe:

- calcular automáticamente balances
- mostrar quién debe
- mostrar cuánto debe
- mostrar quiénes le deben al usuario

IMPORTANTE:

Un usuario NO debe ver TODAS las deudas internas del grupo.

Solo debe poder ver:

- lo que él debe
- lo que le deben a él
- movimientos donde participa

Esto es CRÍTICO.

---

# 7. Liquidaciones

Permitir:

- marcar deudas como pagadas
- pagos parciales
- pagos completos
- historial de liquidaciones
- comprobantes
- estados

Estados:

- pendiente
- parcial
- pagado
- vencido

---

# 8. Dashboard financiero

Mostrar:

- gastos del mes
- ingresos
- balances
- evolución mensual
- categorías
- deudas pendientes
- próximos vencimientos
- cuotas activas
- gastos por grupo
- gráficos interactivos

---

# 9. Notificaciones

Implementar:

- vencimientos
- recordatorios
- nuevas deudas
- pagos recibidos
- invitaciones a grupos

---

# 10. Sistema de invitaciones

Los usuarios deben poder:

- invitar usuarios por email
- aceptar/rechazar invitaciones
- administrar permisos

Roles:

- owner
- admin
- member

---

# Arquitectura obligatoria

Quiero:

- arquitectura escalable
- separación clara de responsabilidades
- modularización
- clean architecture parcial o feature-based
- código altamente tipado
- validaciones compartidas
- DTOs
- services
- repositories
- middlewares
- manejo centralizado de errores

---

# Base de datos

Diseñar correctamente:

- relaciones
- índices
- constraints
- cascadas
- timestamps
- soft delete cuando corresponda

Usar:

- UUIDs
- migraciones Prisma
- seeds

---

# UX/UI

La interfaz debe ser:

- minimalista
- extremadamente limpia
- moderna
- responsive
- mobile-first
- rápida
- accesible

Inspiración visual:

- Linear
- Stripe
- Notion
- Raycast
- Vercel

---

# Requisitos técnicos estrictos

## Frontend

Implementar:

- optimistic updates
- skeleton loaders
- manejo de errores elegante
- estados vacíos
- formularios robustos
- lazy loading
- code splitting
- manejo de cache
- dark mode
- accesibilidad

---

## Backend

Implementar:

- paginación
- filtros
- búsqueda
- logs
- auditoría básica
- validación estricta
- rate limiting
- testing

---

# Testing

Implementar:

## Frontend

- Vitest
- React Testing Library

## Backend

- Jest
- Supertest

---

# DevOps

Configurar:

- Docker
- docker-compose
- variables de entorno
- ESLint
- Prettier
- Husky
- lint-staged
- CI/CD básico

---

# Estructura esperada

@Claude IA -> Espero lo siguiente:

1. arquitectura completa ✅ (Abierto a debate técnico)
2. estructura de carpetas ✅ (Abierto a debate técnico)
3. modelo relacional
4. entidades
5. flujo de autenticación
6. endpoints REST
7. estrategia de seguridad
8. estrategia de refresh tokens
9. manejo de balances
10. algoritmo de cálculo de deudas
11. sistema de cuotas
12. roadmap de desarrollo
13. backlog técnico
14. decisiones arquitectónicas justificadas
15. tradeoffs técnicos

---

# Restricciones importantes

@Claude IA -> Evitar a toda costa:

- código espagueti
- archivos gigantes
- lógica duplicada
- autenticación improvisada
- malas prácticas
- dependencias innecesarias
- overengineering absurdo

---

# Forma de trabajo obligatoria

@Claude IA -> Debes respetar la siguiente estructura:

1. Primero analizar requisitos.
2. Detectar problemas de arquitectura.
3. Proponer mejoras.
4. Cuestionar malas decisiones.
5. Sugerir alternativas.
6. Explicar tradeoffs.
7. Diseñar antes de programar.
8. Luego implementar paso a paso.

@Claude IA -> Nunca avanzar automáticamente sin justificar decisiones importantes.

@Claude IA -> Si detectas problemas de seguridad, escalabilidad o UX:
SE DEBEN señalar.

@Claude IA -> Si algo puede hacerse mejor:
SE DEBE proponer.

@Claude IA -> No seas complaciente al
Actúa como un senior reviewer exigente.

---

# Extras indispensables

Agregar además:

- soporte multi-moneda
- conversión monetaria futura
- auditoría de movimientos
- exportación CSV/PDF
- PWA
- sincronización offline parcial
- sistema de etiquetas
- presupuestos mensuales
- límites de gasto
- analytics financieros
- onboarding inicial
- tour interactivo
- logs de sesiones activas
- revocación de sesiones
- detección de actividad sospechosa básica

---

# Objetivo final

El proyecto debe quedar con calidad suficiente para:

- portfolio profesional
- demostrar seniority técnica
- entrevistas laborales
- escalar a SaaS real
- producción futura
