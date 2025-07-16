
import { useEffect, useState } from 'react';

type Card = {
  _id: string;
  name: string;
  image: string;
  cost: number;
  intensity: number;
  effect: string;
  archetypes: string[];
  maxCopies: number;
};

export default function CardCollectionPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState('');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCard, setNewCard] = useState<Card>({
  _id: '',
  name: '',
  image: '',
  cost: 0,
  intensity: 0,
  effect: '',
  archetypes: [],
  maxCopies: 1
});
const handleNewCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setNewCard({
    ...newCard,
    [name]: name === 'cost' || name === 'intensity' || name === 'maxCopies'
      ? parseInt(value)
      : value
  });
};



  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/cards', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Erreur lors du chargement');
          return;
        }

        setCards(data);
      } catch (err) {
        setError('Erreur réseau.');
      }
    };

    fetchCards();
  }, []);

    const handleDelete = async (id: string) => {
    const confirm = window.confirm("Voulez-vous vraiment supprimer cette carte ?");
    if (!confirm) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/cards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
        setError(data.message || 'Erreur lors de la suppression');
        return;
        }

        setCards(cards.filter(card => card._id !== id));
    } catch (err) {
        setError('Erreur réseau lors de la suppression.');
    }
    };


    const startEdit = (card: Card) => {
        setEditingCard(card); 
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingCard) return;
        const { name, value } = e.target;
        setEditingCard({ ...editingCard, [name]: name === 'cost' || name === 'intensity' || name === 'maxCopies' ? parseInt(value) : value });
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/cards/${editingCard._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(editingCard)
            });

            const data = await res.json();

            if (!res.ok) {
            setError(data.message || 'Erreur lors de la mise à jour');
            return;
            }

            setCards(cards.map(card => card._id === editingCard._id ? data.card : card));
            setEditingCard(null);
        } catch (err) {
            setError('Erreur réseau.');
        }
    };


    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(newCard)
            });

            const data = await res.json();

            if (!res.ok) {
            setError(data.message || 'Erreur lors de la création');
            return;
            }

            setCards([...cards, data.card]);
            setNewCard({
            _id: '',
            name: '',
            image: '',
            cost: 0,
            intensity: 0,
            effect: '',
            archetypes: [],
            maxCopies: 1
            });
            setIsCreating(false);
        } catch (err) {
            setError('Erreur réseau lors de la création.');
        }
    };


    return (

        <div>
            <h2>Ma collection de cartes</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

                {editingCard && (
                    <div>
                        <form onSubmit={handleEditSubmit} style={{ marginBottom: '2rem' }}>
                            <h3>Modifier la carte : {editingCard.name}</h3>

                            <label>
                                Nom :
                                <input name="name" value={editingCard.name} onChange={handleEditChange} required />
                            </label>
                            <br />

                            <label>
                                URL de l'image :
                                <input name="image" value={editingCard.image} onChange={handleEditChange} />
                            </label>
                            <br />

                            <label>
                                Coût en PA :
                                <input type="number" name="cost" value={editingCard.cost} onChange={handleEditChange} />
                            </label>
                            <br />

                            <label>
                                Intensité :
                                <input type="number" name="intensity" value={editingCard.intensity} onChange={handleEditChange} />
                            </label>
                            <br />

                            <label>
                                Copies max :
                                <input type="number" name="maxCopies" value={editingCard.maxCopies} onChange={handleEditChange} />
                            </label>
                            <br />

                            <label>
                                Archétypes :
                                <input
                                name="archetypes"
                                value={editingCard.archetypes.join(', ')}
                                onChange={(e) =>
                                    setEditingCard({
                                    ...editingCard,
                                    archetypes: e.target.value.split(',').map((item) => item.trim())
                                    })
                                }
                                />
                            </label>
                            <br />

                            <label>
                                Effet :
                                <br />
                                <textarea name="effect" value={editingCard.effect} onChange={handleEditChange} />
                            </label>
                            <br />

                            <button type="submit">Valider les modifications</button>
                            <button type="button" onClick={() => setEditingCard(null)}>Annuler</button>
                        </form>

                    </div>
                )}

                <button onClick={() => setIsCreating(!isCreating)}>
                            {isCreating ? 'Annuler la création' : 'Créer une carte'}
                        </button>

                        {isCreating && (
                            <form onSubmit={handleCreateCard}>
                                <h3>Nouvelle carte</h3>

                                <label>
                                Nom :
                                <input name="name" value={newCard.name} onChange={handleNewCardChange} required />
                                </label>
                                <br />

                                <label>
                                URL de l'image :
                                <input name="image" value={newCard.image} onChange={handleNewCardChange} />
                                </label>
                                <br />

                                <label>
                                Coût en PA :
                                <input type="number" name="cost" value={newCard.cost} onChange={handleNewCardChange} />
                                </label>
                                <br />

                                <label>
                                Intensité :
                                <input type="number" name="intensity" value={newCard.intensity} onChange={handleNewCardChange} />
                                </label>
                                <br />

                                <label>
                                Copies max :
                                <input type="number" name="maxCopies" value={newCard.maxCopies} onChange={handleNewCardChange} />
                                </label>
                                <br />

                                <label>
                                Archétypes (séparés par des virgules) :
                                <input
                                    name="archetypes"
                                    value={newCard.archetypes.join(', ')}
                                    onChange={(e) =>
                                    setNewCard({
                                        ...newCard,
                                        archetypes: e.target.value.split(',').map((item) => item.trim())
                                    })
                                    }
                                />
                                </label>
                                <br />

                                <label>
                                Effet :
                                <br />
                                <textarea name="effect" value={newCard.effect} onChange={handleNewCardChange} />
                                </label>
                                <br />

                                <button type="submit">Ajouter la carte</button>
                            </form>
                        )}

            {cards.length === 0 ? (
                <p>Vous n'avez pas encore créé de cartes.</p>
            ) : (
                
                <ul>
                {cards.map((card) => (
                    <li key={card._id}>
                        <strong>{card.name}</strong> — PA : {card.cost}, Intensité : {card.intensity}<br />
                        <em>{card.effect}</em><br />
                        Archétypes : {card.archetypes.join(', ')}<br />
                        Copies max : {card.maxCopies}
                        <br />
                        <button onClick={() => handleDelete(card._id)}>Supprimer</button>
                        <button onClick={() => startEdit(card)}>Modifier</button>

                        <hr />
                    </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
    