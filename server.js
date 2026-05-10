const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Product = mongoose.model('Product', productSchema);

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, 'secretkey');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ username, password: hashedPassword });
  try {
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ _id: user._id }, 'secretkey');
  res.json({ token, user: { username } });
});

app.get('/api/products', verifyToken, async (req, res) => {
  const products = await Product.find({ userId: req.user._id });
  res.json(products);
});

app.post('/api/products', verifyToken, async (req, res) => {
  const { name, quantity, price, category } = req.body;
  const product = new Product({ name, quantity, price, category, userId: req.user._id });
  await product.save();
  res.json(product);
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  const { name, quantity, price, category } = req.body;
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { name, quantity, price, category },
    { new: true }
  );
  res.json(product);
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  res.json({ message: 'Product deleted' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));