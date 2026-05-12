# Arquitectura del Proyecto

## Filosofía

El proyecto utiliza una arquitectura modular feature-based dentro de un monorepo.

La prioridad principal es:

- escalabilidad
- mantenibilidad
- legibilidad
- separación de responsabilidades
- reutilización de código
- tipado compartido
- independencia entre aplicaciones

---

# Monorepo

El repositorio está dividido en:

- apps
- packages
- server

---

# Apps

Contiene todas las aplicaciones cliente.

## Estructura

/apps

- web -> aplicación React/Vite
- mobile -> aplicación React Native
- desktop -> futura aplicación Electron/Tauri

Cada aplicación debe ser independiente y consumir paquetes compartidos desde `/packages`.

---

# Packages

Contiene paquetes reutilizables compartidos entre aplicaciones y backend.

Ejemplos:

- ui
- types
- zod-schemas
- utils
- tailwind-config
- eslint-config
- tsconfig

Objetivo:

- evitar duplicación
- mantener consistencia
- centralizar lógica compartida

---

# Server

El backend utiliza Node.js + Express + TypeScript.

La arquitectura es modular feature-based.

NO se organiza por capas globales.

Cada módulo contiene:

- controllers
- services
- repositories
- routes
- dto
- schemas
- utils

---

# Modules

Cada módulo representa un dominio del sistema.

Ejemplos:

- auth
- users
- expenses
- groups
- balances
- settlements

Cada módulo debe ser autocontenido.

---

# Controllers

Responsables únicamente de:

- recibir requests
- validar inputs
- invocar servicios
- retornar responses

No deben contener lógica de negocio.

---

# Services

Contienen la lógica de negocio.

Deben ser:

- reutilizables
- testeables
- independientes de Express

---

# Repositories

Responsables del acceso a datos.

No deben contener lógica de negocio.

---

# DTOs

Definen contratos internos y externos.

Objetivos:

- evitar exponer modelos directamente
- mantener tipado consistente
- controlar responses

---

# Schemas

Las validaciones se realizan utilizando Zod.

Toda entrada externa debe validarse.

---

# Shared

Contiene recursos compartidos del backend:

- errores
- helpers
- logger
- constants
- types
- auth helpers

---

# Seguridad

La autenticación utiliza:

- JWT access token
- refresh token rotation
- cookies httpOnly
- bcrypt

Se implementan:

- rate limiting
- helmet
- CORS seguro
- CSRF protection
- sanitización

---

# Convenciones

## Naming

- kebab-case para archivos
- PascalCase para clases/types
- camelCase para variables

## Imports

Preferir imports absolutos usando aliases.

## Tipado

No usar `any`.

---

# Testing

Cada módulo debe contener:

- unit tests
- integration tests

---

# Objetivo arquitectónico

La arquitectura está diseñada para:

- soportar múltiples aplicaciones
- facilitar escalabilidad
- minimizar acoplamiento
- facilitar testing
- permitir evolución futura a microservicios
