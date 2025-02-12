# Ejercicio 2: Integración de DynamoDB con Doctrine

> Partiendo de la rama `feature/2-1-estructura-symfony`, crea una rama `feature/2-2-dynamodb-doctrine-usuario` y realiza los pasos que te indica el ejercicio.
> Como este ejercicio requiere de mucha configuración de Symfony que puede dejar el sistema inestable, hazlo si y solo sí quieres profundizar en la configuración del bundle y entender cómo se instala y se solucionan los problemas. En caso contrario, ve directamente a la solución.

En este ejercicio aprenderás a configurar Doctrine para interactuar con DynamoDB como base de datos.

---

## **Objetivos**

1. Configurar DynamoDB como base de datos en un proyecto Symfony.
2. Crear entidades y repositorios básicos con Doctrine.

---

## **Instrucciones**

1. Instala el paquete necesario para integrar Doctrine:
```bash
composer require async-aws/dynamo-db
```

2. Configura el acceso a DynamoDB:
   - Edita el archivo `.env` para incluir las credenciales de AWS.
   - Configura el cliente de DynamoDB en `services.yaml`.

3. Crea una entidad y un repositorio básico:
   - Usa el comando `make:entity` para definir una tabla en DynamoDB.
   - Añade un repositorio en `src/Repository`.

---

## **Recursos Adicionales**

- [Integración de Doctrine y DynamoDB](https://github.com/async-aws/dynamo-db)
- [Guía de configuración de Doctrine](https://symfony.com/doc/current/doctrine.html)

---

¡Buena suerte!
