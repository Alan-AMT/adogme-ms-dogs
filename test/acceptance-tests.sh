#!/bin/bash
# test/acceptance-tests.sh
# Tests de aceptación usando cURL directo
# No se envían headers de autenticación ya que los guards se deshabilitarán según tus instrucciones.

API_URL="http://localhost:3000/dogs-ms"

echo "--------------------------------------------------------"
echo "Ejecutando Test: Crear perro (POST /dogs-ms/dog)"
echo "--------------------------------------------------------"

# Guardamos la respuesta en un archivo para parsear (opcional) pero la logueamos
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/dog" \
-H "Content-Type: application/json" \
--data '{
    "name": "Boby Acceptance Test",
    "breed": "Labrador",
    "age": 2,
    "shelterId": "test-shelter-id",
    "weightKg": 25,
    "sex": "macho",
    "size": "grande",
    "energyLevel": "moderada",
    "description": "Labrador juguetón y dócil",
    "personality": [
        { "label": "Dócil", "category": "caracter" }
    ],
    "goodWithKids": true,
    "goodWithDogs": true,
    "goodWithCats": true,
    "sterilized": false,
    "needsYard": true,
    "isVaccinated": true,
    "isDewormed": true,
    "furLength": "corto",
    "vaccinations": [
        { "name": "Múltiple", "date": "2025-05-15T00:00:00Z", "verified": true }
    ],
    "health": "Sin problemas",
    "photo": "http://foto.com/boby.jpg"
}')

echo "$CREATE_RESPONSE"
echo ""

# Intentamos extraer el ID de la respuesta para los siguientes requests (requiere jq si está disponible) o parseando texto
DOG_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -n 1)

if [ -z "$DOG_ID" ]; then
    echo "⚠️  Atención: No se pudo capturar el DOG_ID de la respuesta. Verifica si el backend devolvió el JSON esperado."
    exit 1
fi

echo "DOG_ID creado: $DOG_ID"
echo "--------------------------------------------------------"
echo "Ejecutando Test: Modificar perro (PUT /dogs-ms/dog/2363aa00-d2e1-4d64-9a09-980bfb755e45)"
# Ejecutando Test: Modificar perro (PUT /dogs-ms/dog/$DOG_ID)
echo "--------------------------------------------------------"

curl -s -X PUT "$API_URL/dog/$DOG_ID" \
-H "Content-Type: application/json" \
--data '{
    "name": "Boby Acceptance Modificado 2",
    "breed": "Labrador chico",
    "age": 1,
    "shelterId": "test-shelter-id",
    "weightKg": 10,
    "sex": "macho",
    "size": "pequeño",
    "energyLevel": "alta",
    "description": "Labrador juguetón y dócil mejorado",
    "personality": [],
    "goodWithKids": true,
    "goodWithDogs": false,
    "goodWithCats": true,
    "sterilized": false,
    "needsYard": true,
    "isVaccinated": true,
    "isDewormed": true,
    "furLength": "corto",
    "vaccinations": [],
    "health": "Sin problemas actualizado",
    "photo": "http://foto.com/boby.jpg"
}'
echo ""
echo "--------------------------------------------------------"

echo "Ejecutando Test: Listar perros (GET /dogs-ms/dogs)"
echo "--------------------------------------------------------"
# Limitar output para que no sature la terminal si hay muchos
curl -s -X GET "$API_URL/dogs" | grep -o "Boby Acceptance Modificado"

echo ""
echo "¡Pruebas ejecutadas!"
