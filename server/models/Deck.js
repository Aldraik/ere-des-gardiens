import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  cards: [
    {
      card: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
      },
      count: {
        type: Number,
        default: 1
      }
    }
  ]
}, { timestamps: true });

const Deck = mongoose.model('Deck', deckSchema);

export default Deck;
