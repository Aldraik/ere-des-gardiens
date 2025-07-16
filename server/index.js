import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.js';
app.use('/api', authRoutes);

import cardRoutes from './routes/cards.js';
app.use('/api/cards', cardRoutes);

import deckRoutes from './routes/decks.js';
app.use('/api/decks', deckRoutes);

app.get('/', (req, res) => {
  res.send("L'Ère des Gardiens API est en ligne !");
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(PORT, () =>
    console.log(`✅ Serveur lancé sur http://localhost:${PORT}`)
  );
}).catch((error) => {
  console.error("❌ Erreur de connexion à MongoDB :", error);
});
