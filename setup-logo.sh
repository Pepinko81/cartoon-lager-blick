#!/bin/bash

# Script to set up HashMatrix logo
echo "🔍 Проверка за лого файлове..."

# Check if HashMatrix.png exists in current directory
if [ -f "HashMatrix.png" ]; then
  echo "✅ Намерен HashMatrix.png в основната директория"
  echo "📋 Копиране към public/logo.png..."
  cp HashMatrix.png public/logo.png
  echo "✅ Готово! Логото е копирано."
elif [ -f "public/HashMatrix.png" ]; then
  echo "✅ Намерен HashMatrix.png в public/"
  echo "📋 Копиране към public/logo.png..."
  cp public/HashMatrix.png public/logo.png
  echo "✅ Готово! Логото е копирано."
elif [ -f "public/logo.png" ]; then
  echo "✅ logo.png вече съществува в public/"
  ls -lh public/logo.png
else
  echo "❌ HashMatrix.png не е намерен!"
  echo ""
  echo "Моля, копирайте вашия HashMatrix.png файл в една от следните локации:"
  echo "  1. ./HashMatrix.png (основна директория)"
  echo "  2. ./public/HashMatrix.png"
  echo ""
  echo "Или директно го копирайте като:"
  echo "  cp <път/към/HashMatrix.png> public/logo.png"
fi

# Verify the logo file exists
if [ -f "public/logo.png" ]; then
  echo ""
  echo "✅ Проверка на logo.png:"
  ls -lh public/logo.png
  file public/logo.png
  echo ""
  echo "🎉 Логото е готово за използване!"
else
  echo ""
  echo "⚠️  ВНИМАНИЕ: logo.png все още не съществува в public/"
fi

