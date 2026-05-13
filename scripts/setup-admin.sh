#!/bin/bash

API_KEY="AIzaSyC6WecBcLCjDM1gUnWLksDpfSgNb2-EcqE"
EMAIL="123456789@eevent.com"
PASSWORD="Admin123456"

echo "=========================================="
echo "  EEvent - Setup Script"
echo "=========================================="
echo ""

echo "1. Obteniendo UID del usuario..."
echo "   Email: $EMAIL"

SIGNIN_RESPONSE=$(curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"returnSecureToken\":true}")

HAS_ERROR=$(echo "$SIGNIN_RESPONSE" | grep -c '"error"' || true)

if [ "$HAS_ERROR" = "0" ]; then
  USER_UID=$(echo "$SIGNIN_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('localId',''))" 2>/dev/null)
  ID_TOKEN=$(echo "$SIGNIN_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('idToken',''))" 2>/dev/null)

  echo "   UID: $USER_UID"
  echo ""
  echo "2. Creando documento en Firestore..."

  DOC_RESPONSE=$(curl -s -X POST \
    "https://firestore.googleapis.com/v1/projects/eevent-59ae4/databases/(default)/documents/usuarios?documentId=$USER_UID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -d "{
      \"fields\": {
        \"cedula\": {\"stringValue\": \"123456789\"},
        \"nombre\": {\"stringValue\": \"Administrador\"},
        \"apellido\": {\"stringValue\": \"EEvent\"},
        \"email\": {\"stringValue\": \"123456789@eevent.com\"},
        \"rol\": {\"stringValue\": \"admin\"},
        \"estado\": {\"stringValue\": \"activo\"},
        \"fechaCreacion\": {\"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"ultimoAcceso\": {\"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
      }
    }")

  HAS_DOC_ERROR=$(echo "$DOC_RESPONSE" | grep -c '"error"' || true)

  if [ "$HAS_DOC_ERROR" = "0" ]; then
    echo "   OK - Documento creado en Firestore"
    echo ""
    echo "3. Publicando reglas de Firestore..."
    echo ""
    echo "   Ve a Firebase Console > Firestore > Reglas"
    echo "   Copia el contenido de firestore.rules y pegalo"
    echo "   > Publicar"
    echo ""
    echo "=========================================="
    echo "  Setup completado!"
    echo "=========================================="
  else
    ERROR=$(echo "$DOC_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null)
    echo "   Error al crear documento: $ERROR"
    echo ""
    echo "   PASOS PARA CREARLO:"
    echo "   1. Firebase Console > Firestore > Reglas"
    echo "   2. Reemplaza todo con:"
    echo "      rules_version = '2';"
    echo "      service cloud.firestore {"
    echo "        match /databases/{database}/documents {"
    echo "          allow read, write: if true;"
    echo "        }"
    echo "      }"
    echo "   3. Publicar"
    echo "   4. Volver a ejecutar: npm run setup:admin"
    echo "   5. Restaurar las reglas originales (contenido de firestore.rules)"
    echo "   6. Publicar"
    echo ""
  fi
else
  ERROR=$(echo "$SIGNIN_RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null)
  echo "   Error al autenticar: $ERROR"
  echo ""
  echo "   Verifica que el usuario existe en:"
  echo "   > Firebase Console > Authentication"
fi

echo ""
echo "=========================================="
echo "  Credenciales"
echo "=========================================="
echo "  Cedula:     123456789"
echo "  Contrasena: Admin123456"
echo ""