# Git Flow: Política de Branching

Este documento describe las políticas de branching que usaremos en el repositorio, junto con ejemplos prácticos, recomendaciones para trabajar de manera eficiente en equipo, y conceptos avanzados para quienes quieran profundizar.

---

## **1. Introducción a Git Flow**

Git Flow es una metodología para gestionar el desarrollo de software utilizando ramas en Git. Permite organizar el trabajo colaborativo, mantener el control del código y garantizar la estabilidad de las versiones.

En este repositorio, utilizaremos una combinación de políticas de branching adaptadas según el propósito del proyecto.

---

## **2. Tipos de Ramas**

### **2.1. Master Only**

- **Uso:** Exclusivo para proyectos que requieren versiones de alta estabilidad, como scripts de Infraestructura como Código (IaC).
- **Política:** Solo se realiza merge a `master` cuando el código ha sido probado y validado completamente.
- **Ventaja:** Garantiza que el código en `master` sea siempre confiable.
- **Ejemplo:** Terraform scripts para aprovisionar infraestructura.

---

### **2.2. Feature Branches**

- **Uso:** Desarrollo de nuevas funcionalidades, ejercicios o experimentos.
- **Convención de nombres:** `feature/<descripción-corta>`
  Ejemplo: `feature/docker-basics`, `feature/terraform-intro`.

- **Política:**
  1. Crea una rama a partir de `master`:
     ```bash
     git checkout -b feature/<descripción-corta>
     ```
  2. Realiza cambios y haz commits descriptivos.
  3. Cuando esté listo, crea un **Pull Request** para revisión antes de fusionar los cambios.

- **Ventaja:** Facilita el desarrollo paralelo sin afectar la rama principal.

---

### **2.3. Branch Environments**

- **Uso:** Simular entornos de desarrollo, staging y producción.
- **Convención de nombres:** `staging/<descripción-corta>`
  Ejemplo: `staging/01-docker-basics`.

- **Política:**
  - Ramas intermedias utilizadas para validar y probar soluciones antes de integrarlas a `master` o `solution`.

- **Ventaja:** Permite pruebas sin comprometer ramas finales.

---

### **2.4. Solution Branches**

- **Uso:** Contienen las soluciones de los ejercicios.
- **Convención de nombres:** `solution/<número-del-bloque>`
  Ejemplo: `solution/01-docker-basics`.

- **Política:**
  - Estas ramas serán liberadas de forma controlada conforme los equipos avancen.
  - Únicamente los tutores realizan merges en estas ramas.

---

## **3. Flujo de Trabajo General**

### **3.1. Inicio de una tarea**

1. Asegúrate de estar en `master`:
   ```bash
   git checkout master
   ```
2. Crea una nueva rama para tu tarea:
   ```bash
   git checkout -b feature/<descripción-corta>
   ```

### **3.2. Trabajo en la rama**

- Realiza cambios en tu rama.
- Guarda los cambios frecuentemente:
  ```bash
  git add .
  git commit -m "Descripción del cambio"
  ```

### **3.3. Finalización de la tarea**

1. Sube tu rama al repositorio remoto:
   ```bash
   git push origin feature/<descripción-corta>
   ```
2. Crea un Pull Request desde GitHub para fusionar con la rama correspondiente.

---

## **4. Formato de los Mensajes de Commit**

Los mensajes de commit deben ser claros y consistentes para facilitar la colaboración. Sigue estas reglas:

1. **Título del commit:** En la **primera línea**, una descripción corta (máximo 50 caracteres) que explique el cambio.
2. **Descripción del commit:** A partir de la **segunda línea**, puedes añadir detalles opcionales como:
   - **Qué hiciste.**
   - **Por qué lo hiciste.**
   - **Problemas que resuelve o pasos para probarlo.**

**Ejemplo de un buen commit:**
```[01-Docker] Añadido archivo docker-compose.yml inicial

- Configuración básica para levantar un contenedor de Nginx.
- Incluye un ejemplo de mapeo de volúmenes y puertos.
```

---

## **5. Conceptos Avanzados**

### **5.1. Squashing**

Combina varios commits en uno solo para mantener un historial más limpio.

**Uso práctico:**
```bash
git rebase -i HEAD~n
```
Donde `n` es el número de commits que deseas combinar. Cambia los commits que no quieras mantener individuales a `squash`.

---

### **5.2. Rebasing**

Permite reescribir el historial de commits para mantener un historial lineal.

**Uso práctico:**
```bash
git rebase master
```
Esto aplica los commits de tu rama sobre los últimos cambios en `master`.

---

### **5.3. Resolución de Conflictos**

Cuando Git no puede combinar cambios automáticamente, te pedirá resolver conflictos manualmente.

**Pasos:**
1. Edita los archivos marcados como conflictivos.
2. Marca los conflictos como resueltos:
   ```bash
   git add <archivo>
   ```
3. Continúa el proceso:
   ```bash
   git rebase --continue
   ```

---

## **6. Recursos Adicionales**

### Conceptos Básicos de Git

- [Git - The Simple Guide](https://rogerdudler.github.io/git-guide/)
- [Pro Git Book (Capítulo 3)](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

### Flujo Avanzado

- [A Successful Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)
- [Git Rebase vs Merge Explained](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)

### Videos

- [Git Basics for Beginners](https://www.youtube.com/watch?v=HVsySz-h9r4)
- [Advanced Git Tutorial](https://www.youtube.com/watch?v=qsTthZi23VE)

---

Este flujo está diseñado para ayudarte a trabajar eficientemente con Git y a comprender las prácticas avanzadas que se utilizan en entornos profesionales. ¡Explora los recursos y practica en tus proyectos!
