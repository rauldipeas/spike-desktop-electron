#!/bin/bash

APP_NAME="spike-desktop"
ICON_FILE="resources/spike.svg"
ARCH="x64"
PLATFORM="linux"
VERSION="0.0.1"
DESCRIPTION="Cliente desktop não oficial do Spike"
CATEGORIES="Network;Email;"
PRODUCT_NAME="Spike"
GENERIC_NAME="Email Client"
MAINTAINER="Raul Dipeas <github@disroot.org>"

echo "🔧 Empacotando com electron-packager..."
npx electron-packager . "$APP_NAME" \
  --platform="$PLATFORM" \
  --arch="$ARCH" \
  --icon="$ICON_FILE" \
  --overwrite \
  --executable-name="$APP_NAME"

echo "📦 Gerando .deb com electron-installer-debian..."
npx electron-installer-debian \
  --src "${APP_NAME}-${PLATFORM}-${ARCH}/" \
  --dest dist/ \
  --arch amd64 \
  --options.version="$VERSION" \
  --options.name="$APP_NAME" \
  --options.productName="$PRODUCT_NAME" \
  --options.genericName="$GENERIC_NAME" \
  --options.icon="$ICON_FILE" \
  --options.maintainer="$MAINTAINER" \
  --options.description="$DESCRIPTION" \
  --options.categories="$CATEGORIES"

echo "✅ .deb criado em: dist/${APP_NAME}_${VERSION}_amd64.deb"
