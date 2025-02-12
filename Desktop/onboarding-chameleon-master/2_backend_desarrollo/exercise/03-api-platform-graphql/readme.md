# Ejercicio 3: Configuración de API Platform con GraphQL

> Partiendo de la rama `feature/2-2-dynamodb-doctrine`, crea una rama `feature/2-3-api-platform-graphql-usuario` y realiza los pasos que te indica el ejercicio.
> Como este ejercicio requiere de mucha configuración de Symfony que puede dejar el sistema inestable, hazlo si y solo sí quieres profundizar en la configuración del bundle y entender cómo se instala y se solucionan los problemas. En caso contrario, ve directamente a la solución.

En este ejercicio configurarás API Platform para generar un esquema GraphQL basado en tus entidades.

---

## **Objetivos**

1. Instalar y configurar API Platform en un proyecto Symfony.
2. Generar un esquema GraphQL basado en entidades Doctrine.
3. Probar consultas y mutaciones básicas.

---

## **Instrucciones**

1. Instala API Platform en tu proyecto:
```bash
composer require api
```

2. Configura API Platform:
   - Habilita la compatibilidad con GraphQL en `config/packages/api_platform.yaml`.

3. Prueba las consultas y mutaciones:
   - Abre la interfaz GraphQL en `/graphql` y prueba operaciones con tus entidades.

---

## **Recursos Adicionales**

- [Documentación oficial de API Platform](https://api-platform.com/docs/)
- [GraphQL en API Platform](https://api-platform.com/docs/core/graphql/)

---

¡Buena suerte!
