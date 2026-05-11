const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// In-memory storage
let users = [];
let products = [];

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = { id: crypto.randomUUID(), username, password: hashedPassword };
  users.push(user);
  res.json({ message: 'User registered' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secretkey');
  res.json({ token, user: { username } });
});

app.get('/api/products', verifyToken, (req, res) => {
  const userProducts = products.filter(p => p.userId === req.user.id);
  res.json(userProducts);
});

app.post('/api/products', verifyToken, (req, res) => {
  const { name, quantity, price, category } = req.body;
  const product = { id: crypto.randomUUID(), name, quantity, price, category, userId: req.user.id };
  products.push(product);
  res.json(product);
});

app.put('/api/products/:id', verifyToken, (req, res) => {
  const { name, quantity, price, category } = req.body;
  const productIndex = products.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (productIndex === -1) return res.status(404).json({ message: 'Product not found' });

  products[productIndex] = { ...products[productIndex], name, quantity, price, category };
  res.json(products[productIndex]);
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id && p.userId === req.user.id);
  if (productIndex === -1) return res.status(404).json({ message: 'Product not found' });

  products.splice(productIndex, 1);
  res.json({ message: 'Product deleted' });
});