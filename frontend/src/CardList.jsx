import { useEffect, useState } from 'react'
import { apiFetch } from './api'

function CardList({ deck, onChanged, onClose }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadCards() {
    try {
      setError('')
      setCards(await apiFetch(`/cards?deckId=${deck.id}`))
    } catch (err) {
      setError(err.message || 'Could not load the questions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadCards()
  }, [deck.id])

  async function deleteCard(card) {
    if (!window.confirm('Delete this question? This cannot be undone.')) return

    try {
      setError('')
      await apiFetch(`/cards/${card.id}`, { method: 'DELETE' })
      await loadCards()
      onChanged()
    } catch (err) {
      setError(err.message || 'Could not delete the question.')
    }
  }

  return (
    <section className="panel card-list-panel">
      <div className="panel-heading">
        <div>
          <h2>{deck.name}: questions</h2>
          <p>{cards.length} questions in this deck.</p>
        </div>

        <button className="secondary-button" onClick={onClose}>
          Close
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading questions...</p>
      ) : cards.length === 0 ? (
        <p>No questions yet. Use Add MCQ to create one.</p>
      ) : (
        <div className="card-list">
          {cards.map((card) => (
            <article className="card-list-item" key={card.id}>
              <div>
                <strong>{card.question}</strong>
                <p>Answer: {card.correctAnswer}</p>
              </div>

              <button
                className="add-mcq-button danger-button"
                onClick={() => deleteCard(card)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default CardList