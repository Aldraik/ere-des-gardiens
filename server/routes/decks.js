import express from 'express';
import Deck from '../models/Deck.js';
import verifyToken from '../middleware/authMiddleware.js';
import Card from '../models/Card.js';


const router = express.Router();

// 🔸 Créer un nouveau deck
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, cards } = req.body;

    // Vérification du total de cartes
    const totalCount = cards.reduce((acc, item) => acc + item.count, 0);
    if (totalCount < 15) {
      return res.status(400).json({ message: "Un deck doit contenir au moins 15 cartes." });
    }

    // Vérification des limites d'exemplaires
    for (const { card, count } of cards) {
      const cardData = await Card.findById(card);
      if (!cardData) return res.status(404).json({ message: "Carte introuvable." });

      if (count > cardData.maxCopies) {
        return res.status(400).json({
          message: `La carte "${cardData.name}" est limitée à ${cardData.maxCopies} exemplaire(s) par deck.`
        });
      }
    }

    // 🔍 Vérifier si un autre deck porte déjà ce nom (insensible à la casse)
    const existingDeck = await Deck.findOne({
      owner: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existingDeck) {
      return res.status(400).json({ message: "Un deck avec ce nom existe déjà." });
    }

    const newDeck = new Deck({
      owner: req.user.id,
      name,
      cards
    });

    await newDeck.save();
    res.status(201).json({ message: "Deck créé avec succès.", deck: newDeck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création du deck." });
  }
});

// 🔹 Obtenir tous les decks de l'utilisateur
router.get('/', verifyToken, async (req, res) => {
  try {
    const decks = await Deck.find({ owner: req.user.id }).populate('cards.card');
    console.log(decks)
    const cleaned = await Promise.all(decks.map(async deck => {
      // Filtre les entrées où la carte existe encore
      const validEntries = deck.cards.filter(e => e.card);
      // Si certaines étaient invalides, on sauvegarde le deck nettoyé
      if (validEntries.length !== deck.cards.length) {
        deck.cards = validEntries;
        await deck.save();
      }
      return deck;
    }));

    res.status(200).json(cleaned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération des decks." });
  }
});

// 🔸 Mettre à jour un deck (nom ou cartes)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, cards } = req.body;

    // 🔒 Vérification du total de cartes
    const totalCount = cards.reduce((acc, item) => acc + item.count, 0);
    if (totalCount < 15) {
      return res.status(400).json({ message: "Un deck doit contenir au moins 15 cartes." });
    }

    // 🔍 Vérification des cartes et des limites
    for (const { card, count } of cards) {
      const cardData = await Card.findById(card);
      if (!cardData) return res.status(404).json({ message: "Carte introuvable." });

      if (count > cardData.maxCopies) {
        return res.status(400).json({
          message: `La carte "${cardData.name}" est limitée à ${cardData.maxCopies} exemplaire(s) par deck.`
        });
      }
    }

    // 🔍 Vérifier si un autre deck porte déjà ce nom (insensible à la casse)
    const existingDeck = await Deck.findOne({
      owner: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id } // exclure le deck courant pour PUT
    });
    if (existingDeck) {
      return res.status(400).json({ message: "Un deck avec ce nom existe déjà." });
    }

    // ✅ Mise à jour avec population pour que les noms s'affichent côté client
    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, cards },
      { new: true }
    ).populate('cards.card');

    if (!updatedDeck) return res.status(404).json({ message: "Deck introuvable." });

    res.json({ message: "Deck mis à jour.", deck: updatedDeck });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour." });
  }
});

// 🔁 Cloner un deck
// 🔁 Cloner un deck
router.post('/:id/clone', verifyToken, async (req, res) => {
  try {
    const original = await Deck.findOne({ _id: req.params.id, owner: req.user.id });
    if (!original) {
      return res.status(404).json({ message: "Deck introuvable." });
    }

    const newName = original.name + " (copie)";
    const clone = new Deck({
      owner: req.user.id,
      name: newName,
      cards: original.cards
    });
    await clone.save();
    const populated = await clone.populate('cards.card');

    // ✅ Très important : renvoyer JSON non-vide
    return res.status(201).json({ message: "Deck cloné avec succès.", deck: populated });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur lors du clonage du deck." });
  }
});




// 🔻 Supprimer un deck
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!deck) return res.status(404).json({ message: "Deck introuvable." });

    res.status(200).json({ message: "Deck supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

export default router;
