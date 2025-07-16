import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  cost: {
    type: Number,
    required: true
  },
  intensity: {
    type: Number,
    required: true
  },
  effect: {
    type: String,
    required: true
  },
  archetypes: {
    type: [String],
    default: []
  },
  maxCopies: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

const Card = mongoose.model('Card', cardSchema);

export default Card;
