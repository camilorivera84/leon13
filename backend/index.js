const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend desde ../public
app.use(express.static(path.join(__dirname, '../public')));

// Archivos JSON
const inventoryPath = path.join(__dirname, 'inventory.json');
const facturasPath = path.join(__dirname, 'facturas.json');

// Utilidad para leer archivo JSON o crear vacío si no existe
function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// ---------------- INVENTARIO -----------------

app.get('/api/inventory', (req, res) => {
  const inventory = readJsonFile(inventoryPath);
  res.json(inventory);
});

app.post('/api/inventory', (req, res) => {
  const { nombre, categoria, cantidad, precio } = req.body;
  if (!nombre || !categoria || cantidad == null || precio == null) {
    return res.status(400).json({ mensaje: 'Datos incompletos' });
  }

  const inventory = readJsonFile(inventoryPath);
  const nuevoProducto = {
    id: inventory.length ? inventory[inventory.length - 1].id + 1 : 1,
    nombre,
    categoria,
    cantidad,
    precio,
  };

  inventory.push(nuevoProducto);
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  res.status(201).json(nuevoProducto);
});

app.put('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { cantidad } = req.body;

  const inventory = readJsonFile(inventoryPath);
  const producto = inventory.find((p) => p.id === id);
  if (!producto) {
    return res.status(404).json({ mensaje: 'Producto no encontrado' });
  }

  if (cantidad == null || cantidad < 0) {
    return res.status(400).json({ mensaje: 'Cantidad inválida' });
  }

  producto.cantidad = cantidad;
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  res.json(producto);
});

app.delete('/api/inventory/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let inventory = readJsonFile(inventoryPath);

  const index = inventory.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Producto no encontrado' });
  }

  inventory.splice(index, 1);
  fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
  res.json({ mensaje: 'Producto eliminado' });
});

// ---------------- FACTURAS -----------------

app.post('/api/facturas', (req, res) => {
  const { cliente, cedula, productos, total } = req.body;

  if (
    !cliente ||
    !cedula ||
    !Array.isArray(productos) ||
    productos.length === 0 ||
    total == null
  ) {
    return res.status(400).json({ mensaje: 'Datos incompletos o inválidos' });
  }

  let facturas = readJsonFile(facturasPath);

  const nuevaFactura = {
    id: facturas.length ? facturas[facturas.length - 1].id + 1 : 1,
    cliente,
    cedula,
    productos,
    total,
    fecha: new Date().toISOString(),
  };

  facturas.push(nuevaFactura);
  fs.writeFileSync(facturasPath, JSON.stringify(facturas, null, 2));

  res.status(201).json({ mensaje: 'Factura guardada', factura: nuevaFactura });
});

app.get('/api/facturas', (req, res) => {
  const facturas = readJsonFile(facturasPath);
  res.json(facturas);
});

// ---------------- INICIAR SERVIDOR -----------------

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
