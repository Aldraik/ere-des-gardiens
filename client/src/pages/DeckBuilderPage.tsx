import { useEffect, useState } from 'react';
import { secureFetch } from '../utils/api';


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

type DeckEntry = {
  card: Card;
  count: number;
};

type Deck = {
  _id: string;
  name: string;
  cards: { card: Card; count: number }[];
  createdAt: string;   // ✅ ajoute ceci
  updatedAt: string;   // ✅ et ceci aussi
};


export default function DeckBuilderPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [deck, setDeck] = useState<DeckEntry[]>([]);
    const [deckName, setDeckName] = useState('');
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
    const [savedDecks, setSavedDecks] = useState<Deck[]>([]);
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [sortBy, setSortBy] = useState<'created' | 'updated'>('created');
    const loadDeck = (d: Deck) => {
    setCurrentDeckId(d._id);
    setDeckName(d.name);
    setDeck(d.cards.map(entry => ({ ...entry })));
    };
    
    const handleDeleteDeck = async (deckId: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce deck ?")) return;

        try {
            const token = localStorage.getItem('token');
            const data = await secureFetch(`http://localhost:5000/api/decks/${deckId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
            });
  
            if (!data.ok) {
            setError(data.message || "Erreur lors de la suppression du deck.");
            return;
            }
            // Retirer le deck supprimé de l'affichage
            setSavedDecks(prev => prev.filter(d => d._id !== deckId));
            // Si c’était le deck en cours, réinitialiser la construction
            if (currentDeckId === deckId) {
            setDeck([]);
            setDeckName('');
            setCurrentDeckId(null);
            }
        } catch (err) {
            setError("Erreur réseau lors de la suppression du deck.");
        }
    };

    const [filterName, setFilterName] = useState('');
    const [filterCost, setFilterCost] = useState('');
    const [filterIntensity, setFilterIntensity] = useState('');
    const [filterArchetype, setFilterArchetype] = useState('');
    // const [archetypeFilter, setArchetypeFilter] = useState('');


    const handleUpdateDeck = async () => {
    const totalCount = deck.reduce((a, e) => a + e.count, 0);
  if (totalCount < 15) { setError("Un deck doit contenir au moins 15 cartes."); return; }

    try {
        const token = localStorage.getItem('token');
        const body = {
            name: deckName,
            cards: deck.map(e => ({ card: e.card._id, count: e.count }))
        };

        const data = await secureFetch(`http://localhost:5000/api/decks/${currentDeckId}`, {
            method: 'PUT',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        alert("Deck mis à jour !");
        setSavedDecks((prevDecks) =>
            prevDecks.map((d) => d._id === data.deck._id ? data.deck : d)
        );

        // 🔁 Réinitialise la vue pour revenir à l’état vide
        setCurrentDeckId(null);
        setDeck([]);
        setDeckName('');
        } catch (err) {
            setError("Erreur réseau lors de la mise à jour du deck.");
        }
    };

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await secureFetch('http://localhost:5000/api/cards');
        setCards(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des cartes.');
      }
    };

    fetchCards();
  }, []);

  const fetchSavedDecks = async () => {
    setLoadingDecks(true);
    try {
      const data = await secureFetch('http://localhost:5000/api/decks');
      setSavedDecks(data);
    } catch (err: any) {
      console.error('Erreur fetch:', err.message);
      setError(err.message || 'Erreur lors de la récupération des decks.');
    } finally {
      setLoadingDecks(false);
    }
  };

    useEffect(() => {
        fetchSavedDecks();
    }, []);

  // 🔸 Création d'une carte
  const handleNewCardChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCard({
      ...newCard,
      [name]: name === 'cost' || name === 'intensity' || name === 'maxCopies'
        ? parseInt(value)
        : value
    });
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch('http://localhost:5000/api/cards', {
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

  // 🔹 Ajout de carte au deck
  const addToDeck = (card: Card) => {
    const existing = deck.find((entry) => entry.card._id === card._id);
    const countInDeck = existing?.count || 0;

    if (countInDeck >= card.maxCopies) {
      setError(`Vous avez atteint la limite (${card.maxCopies}) pour la carte "${card.name}".`);
      return;
    }

    const updated = existing
      ? deck.map((entry) =>
          entry.card._id === card._id ? { ...entry, count: entry.count + 1 } : entry
        )
      : [...deck, { card, count: 1 }];

    setDeck(updated);
  };

  const removeFromDeck = (cardId: string) => {
    setDeck(deck
      .map((entry) =>
        entry.card._id === cardId ? { ...entry, count: entry.count - 1 } : entry
      )
      .filter((entry) => entry.count > 0));
  };

  // 🔸 Sauvegarde du deck
  const handleSaveDeck = async () => {
    const totalCount = deck.reduce((acc, entry) => acc + entry.count, 0);
    if (totalCount < 15) {
      setError("Un deck doit contenir au moins 15 cartes.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const body = {
        name: deckName,
        cards: deck.map((entry) => ({
          card: entry.card._id,
          count: entry.count
        }))
      };

      const res = await secureFetch('http://localhost:5000/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Erreur lors de la création du deck.');
        return;
      }

      // setSavedDecks(prev => [...prev, data.deck]);
      alert("Deck créé !");
      setDeck([]);
      setDeckName('');
      await fetchSavedDecks(); // Ajoute ça à la fin de handleSaveDeck
    } catch (err) {
      setError("Erreur réseau lors de la sauvegarde du deck.");
    }
  };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingCard) return;
        const { name, value } = e.target;
        setEditingCard({
            ...editingCard,
            [name]: name === 'cost' || name === 'intensity' || name === 'maxCopies'
            ? parseInt(value)
            : value
        });
        };

        const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;

        try {
            const token = localStorage.getItem('token');
            const res = await secureFetch(`http://localhost:5000/api/cards/${editingCard._id}`, {
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
            setError('Erreur réseau lors de la mise à jour.');
        }
        };

        const handleCloneDeck = async (deckId: string) => {
          try {
            const data = await secureFetch(`http://localhost:5000/api/decks/${deckId}/clone`, {
              method: 'POST'
            }); // data = { message, deck }

            setSavedDecks(prev => [...prev, data.deck]);
            alert(data.message);
          } catch (err: any) {
            setError(err.message);
          }
        };

        const handleDelete = async (id: string) => {
        const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette carte ?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('token');
            const res = await secureFetch(`http://localhost:5000/api/cards/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) {
            setError(data.message || 'Erreur lors de la suppression.');
            return;
            }

            setCards(cards.filter(card => card._id !== id));
        } catch (err) {
            setError('Erreur réseau lors de la suppression.');
        }
        };


  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* 📦 Section Collection */}
      <div style={{ flex: 1 }}>
        <h2>Collection</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Annuler la création' : 'Créer une carte'}
        </button>

        {isCreating && (
            <form onSubmit={handleCreateCard}>
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
                        archetypes: e.target.value.split(',').map((str) => str.trim())
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

                <button type="submit">Ajouter</button>
            </form>
        )}

        {editingCard && (
            <form onSubmit={handleEditSubmit}>
                <h3>Modifier la carte : {editingCard.name}</h3>

                <label>
                    Nom :
                    <input name="name" value={editingCard.name} onChange={handleEditChange} />
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
                        archetypes: e.target.value.split(',').map((str) => str.trim())
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
        )}

        <h4>Filtres :</h4>
        <div style={{ margin: '1rem 0' }}>
            <label>
                Nom :
                <input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Nom de la carte"
                />
            </label>{' '}
            <label>
                Coût :
                <input
                type="number"
                value={filterCost}
                onChange={(e) => setFilterCost(e.target.value)}
                placeholder="Coût exact"
                />
            </label>{' '}
            <label>
                Intensité :
                <input
                type="number"
                value={filterIntensity}
                onChange={(e) => setFilterIntensity(e.target.value)}
                placeholder="Intensité exacte"
                />
            </label>{' '}
            <label>
                Archétype :
                <input
                value={filterArchetype}
                onChange={(e) => setFilterArchetype(e.target.value)}
                placeholder="Ex: Sort, Cendré, Martial..."
                />
            </label>

        <button
            onClick={() => {
                setFilterName('');
                setFilterCost('');
                setFilterIntensity('');
                setFilterArchetype('');
            }}
            >
            Réinitialiser les filtres
        </button>


            </div>
        <br />

        <ul>
          {cards
            .filter((card) =>
                card.name.toLowerCase().includes(filterName.toLowerCase()) &&
                (filterCost === '' || card.cost === Number(filterCost)) &&
                (filterIntensity === '' || card.intensity === Number(filterIntensity)) &&
                (filterArchetype === '' ||
                card.archetypes.some((a) =>
                    a.toLowerCase().includes(filterArchetype.toLowerCase())
                ))
            )
            .map((card) => (
                <li key={card._id}>
                <strong>{card.name}</strong> (PA : {card.cost}, Intensité : {card.intensity})<br />
                <u>Archétypes : {card.archetypes.join(', ')}</u><br />
                {card.effect}<br />
                Copies max : {card.maxCopies}<br />
                <button onClick={() => addToDeck(card)}>Ajouter au deck</button>
                <button onClick={() => handleDelete(card._id)}>Supprimer</button>
                <button onClick={() => setEditingCard(card)}>Modifier</button>
                </li>
            ))}
        </ul>
      </div>

      {/* 🧾 Section Deck */}
        <div style={{ flex: 1 }}>
            <h2>Deck en cours</h2>

            <label>
            Nom du deck :
            <input value={deckName} onChange={(e) => setDeckName(e.target.value)} />
            </label>

            {deck.length === 0 ? (
            <p>Ajoutez des cartes à votre deck.</p>
            ) : (
            <ul>
                {deck.map((entry) => (
                <li key={entry.card._id}>
                    {entry.card.name} × {entry.count}
                    <button onClick={() => removeFromDeck(entry.card._id)}>Retirer</button>
                </li>
                ))}
            </ul>
            )}

            <button onClick={currentDeckId ? handleUpdateDeck : handleSaveDeck}>
                {currentDeckId ? 'Mettre à jour le deck' : 'Sauvegarder ce deck'}
            </button>


            <h3>📁 Mes decks sauvegardés</h3>
            {loadingDecks ? (
              <p>Chargement des decks...</p>
            ): savedDecks.length === 0 ? (
            <p>Aucun deck sauvegardé pour le moment.</p>
            ) : (
            <ul>
              <div style={{ marginBottom: '1rem' }}>
                <label>
                  Trier par :
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'created' | 'updated')}>
                    <option value="created">Date de création</option>
                    <option value="updated">Date de mise à jour</option>
                  </select>
                </label>
              </div>

                {[...savedDecks]
                  .sort((a, b) => {
                    const field = sortBy === 'created' ? 'createdAt' : 'updatedAt';
                    return new Date(b[field]).getTime() - new Date(a[field]).getTime();
                  })
                  .map((deck) => (
                    <li key={deck._id}>
                        <strong>{deck.name}</strong> — {deck.cards.reduce((acc, c) => acc + c.count, 0)} carte(s)
                        <ul>
                            {deck.cards.map(({ card, count }, index) => (
                                card && typeof card === 'object' && 'name' in card ? (
                                    <li key={card._id}>{card.name} — x{count}</li>
                                ) : (
                                    <li key={index} style={{ color: 'red' }}>
                                    Carte supprimée ou introuvable — x{count}
                                    </li>
                                )
                            ))}
                        </ul>
                        <button onClick={() => loadDeck(deck)}>Modifier ce deck</button>
                        <button onClick={() => handleCloneDeck(deck._id)}>Cloner ce deck</button>
                        <button onClick={() => handleDeleteDeck(deck._id)}>Supprimer ce deck</button>
                    </li>
                ))}
            </ul>
          )}

        </div>
    </div>
  );
}
