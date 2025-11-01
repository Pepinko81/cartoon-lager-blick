# Implementation Plan - Map and Logo Improvements

## 1. Logo Position Fix
**Problem**: Logo не е точно зад и над регалът
**Solution**: 
- Регалът е завъртян на -90° (по Z-оста)
- Background стената е на [0, 5, -6] с височина 15
- Логото трябва да е на [0, rackHeight/2 + offset, -5.8] - точно над центъра на регалът
- Default position: [0, 5, -5.8] (средна височина)

## 2. Map Zoom Fix  
**Problem**: Регалите не се мащабират с картата при zoom
**Solution**:
- Регалите вече са в контейнер с `scale(${zoom})`
- Проблемът е че `transform: translate(-50%, -50%)` се прилага преди scale
- Трябва да използваме `transform-origin: center center` правилно
- Позициите трябва да се преизчисляват спрямо zoom

## 3. Map Drawing Feature
**Problem**: Трябва опция за чертане на собствена карта
**Solution**:
- Добави бутон "Karte zeichnen" до "Grundriss hochladen"
- HTML5 Canvas за чертане с инструменти (линия, правоъгълник, свободен рисуване)
- Експорт на canvas като изображение
- Запазване на canvas данни в database като base64 или като файл

## 4. Floor Plan in 2D View
**Problem**: Floor plan трябва да се показва в 2D view
**Solution**:
- Fetch floor plan в WarehouseView
- Покажи като background в 2D grid view
- Скалиране според размер на контейнера

## 5. Rack Rotation on Map
**Problem**: Регалите трябва да могат да се завъртат, не само местят
**Solution**:
- Добави `rotation` field в Rack type и database
- Добави rotation handle на rack елементите
- Двойно кликване или drag на rotation handle за завъртане
- Визуализирай rotation в 2D view
- Запазване на rotation в database

## Implementation Steps

### Step 1: Fix Logo Position
- Промени default position на [0, rackHeight/2 + 2, -5.8]
- Динамично изчисляване на position_y спрямо височината на регалът

### Step 2: Fix Map Zoom
- Използвай transform-origin правилно
- Преизчислявай позиции спрямо zoom

### Step 3: Add Drawing Feature
- Създай MapDrawingCanvas component
- Инструменти: pencil, rectangle, line, erase
- Експорт и запазване

### Step 4: Floor Plan in 2D
- Fetch floor plan в WarehouseView
- Приложи като background в Rack component

### Step 5: Rack Rotation
- Добави rotation column в database
- UI за rotation
- Визуализация

