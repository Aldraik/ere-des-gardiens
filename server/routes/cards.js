import express from 'express';
import Card from '../models/Card.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔸 Créer une carte
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, image, cost, intensity, effect, archetypes, maxCopies } = req.body;

    const newCard = new Card({
      owner: req.user.id,
      name,
      image,
      cost,
      intensity,
      effect,
      archetypes,
      maxCopies
    });

    await newCard.save();
    res.status(201).json({ message: "Carte créée avec succès.", card: newCard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création de la carte." });
  }
});

// 🔹 Récupérer toutes les cartes de l'utilisateur connecté
router.get('/', verifyToken, async (req, res) => {
  try {
    const cards = await Card.find({ owner: req.user.id });
    res.status(200).json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération des cartes." });
  }
});

// 🔸 Modifier une carte
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );

    if (!card) return res.status(404).json({ message: "Carte introuvable." });

    res.status(200).json({ message: "Carte mise à jour.", card });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
});

// 🔻 Supprimer une carte
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!card) return res.status(404).json({ message: "Carte introuvable." });

    res.status(200).json({ message: "Carte supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

export default router;
