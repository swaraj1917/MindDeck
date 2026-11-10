
import { useEffect, useState } from 'react'
import CardForm from './CardForm'
import './App.css'

const API_URL = 'http://localhost:5000/api'
const USER_ID = 'cmvt5qrkl0000duvo0ww9vs2b'

function App() {
  const [decks, setDecks] = useState([])
  const [studyQueue, setStudyQueue] = useState([])
  const [queueInfo, setQueueInfo] = useState(null)
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeCard, setActiveCard] = useState(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [selectedDeck, setSelectedDeck] = useState(null)

  async function loadDashboard() {
    try {
      setError('')

      const [
        decksResponse,
        studyResponse,
        statsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/decks`),
        fetch(`${API_URL}/study/due?userId=${USER_ID}`),
        fetch(`${API_URL}/stats?userId=${USER_ID}`),
      ])

      if (
        !decksResponse.ok ||
        !studyResponse.ok ||
        !statsResponse.ok
      ) {
        throw new Error('Could not load your dashboard. Please try again.')
      }

      const decksData = await decksResponse.json()
      const studyData = await studyResponse.json()
      const statsData = await statsResponse.json()

      setDecks(decksData)
      setStudyQueue(studyData.cards)
      setQueueInfo(studyData)
      setStats(statsData)

      setActiveCard((current) => {
        if (
          current &&
          studyData.cards.some((card) => card.id === current.id)
        ) {
          return current
        }

        return studyData.cards[0] || null
      })

      setShowAnswer(false)
    } catch (err) {
      setError(err.message || 'Unable to connect to MindDeck.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function createDeck(event) {
    event.preventDefault()

    const name = newDeckName.trim()

    if (!name) {
      setError('Please enter a deck name.')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`${API_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          userId: USER_ID,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not create the deck.')
      }

      setNewDeckName('')
      setShowCreateDeck(false)

      await loadDashboard()
    } catch (err) {
      setError(err.message || 'Could not create the deck.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitRating(rating) {
    if (!activeCard || submitting) return

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: USER_ID,
          cardId: activeCard.id,
          rating,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not save your review.')
      }

      await loadDashboard()
    } catch (err) {
      setError(err.message || 'Could not save your review.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCardCreated() {
    setSelectedDeck(null)
    await loadDashboard()
  }

  const totalCards = decks.reduce(
    (total, deck) => total + (deck._count?.cards || 0),
    0
  )

  const studiedToday = queueInfo?.newCardsReviewedToday || 0
  const dailyLimit = queueInfo?.dailyNewCardLimit || 20

  const progress = dailyLimit > 0
    ? Math.min(100, (studiedToday / dailyLimit) * 100)
    : 0

  const maxDailyReviews = Math.max(
    1,
    ...(stats?.last30Days || []).map((day) => day.count)
  )

  if (loading) {
    return (
      <main className="app-shell">
        <p className="loading-message">
          Loading your MindDeck dashboard...
        </p>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">M</span>
          <span>MindDeck</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <a className="nav-link active" href="#dashboard">
            <span>▦</span> Dashboard
          </a>

          <a className="nav-link" href="#decks">
            <span>▤</span> My decks
          </a>

          <a className="nav-link" href="#study">
            <span>◷</span> Study session
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>

          <div>
            <strong>Demo User</strong>
            <span>Personal workspace</span>
          </div>
        </div>
      </aside>

      <section className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR LEARNING SPACE</p>
            <h1>Dashboard</h1>
          </div>

          <div className="header-actions">
            <button
              className="primary-button"
              onClick={() => {
                setError('')
                setShowCreateDeck((current) => !current)
                setSelectedDeck(null)
              }}
            >
              + Create deck
            </button>

            <button
              className="secondary-button"
              onClick={loadDashboard}
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {showCreateDeck && (
          <section className="panel create-deck-panel">
            <div className="panel-heading">
              <div>
                <h2>Create a new deck</h2>
                <p>Give your flashcard collection a name.</p>
              </div>
            </div>

            <form
              onSubmit={createDeck}
              className="create-deck-form"
            >
              <label htmlFor="deckName">Deck name</label>

              <input
                id="deckName"
                type="text"
                value={newDeckName}
                onChange={(event) => setNewDeckName(event.target.value)}
                placeholder="e.g. JavaScript Interview Prep"
                maxLength={100}
                required
              />

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create deck'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={submitting}
                  onClick={() => {
                    setShowCreateDeck(false)
                    setNewDeckName('')
                    setError('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="welcome-tag">
              YOUR DAILY CHECK-IN
            </span>

            <h2>Small steps. Strong memory.</h2>

            <p>
              Keep your knowledge fresh, one flashcard at a time.
            </p>

            <a className="primary-button" href="#study">
              Start studying <span>→</span>
            </a>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-card art-card-back">Aa</div>

            <div className="art-card art-card-front">
              <span>✳</span>
              <strong>Learn</strong>
              <small>Remember more</small>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">▤</div>
            <p>Total decks</p>
            <strong>{decks.length}</strong>
            <span>Your collections</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon blue">▣</div>
            <p>Total flashcards</p>
            <strong>{totalCards}</strong>
            <span>Across all your decks</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon orange">◷</div>
            <p>Cards in today's queue</p>
            <strong>{studyQueue.length}</strong>
            <span>Ready for your next session</span>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>New cards studied</p>

            <strong>
              {studiedToday}
              <span className="stat-total"> / {dailyLimit}</span>
            </strong>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </article>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Learning activity</h2>
              <p>Your review activity over the last 30 days.</p>
            </div>

            <span className="count-pill">
              {stats?.totalReviews || 0} reviews
            </span>
          </div>

          <div className="activity-summary">
            <article>
              <span>Reviews today</span>
              <strong>{stats?.reviewsToday || 0}</strong>
            </article>

            <article>
              <span>Current streak</span>
              <strong>
                {stats?.currentStreak || 0}
                <small> days</small>
              </strong>
            </article>
          </div>

          <div className="activity-chart">
            {(stats?.last30Days || []).map((day) => (
              <div
                className="activity-day"
                key={day.date}
              >
                <div
                  className="activity-bar-track"
                  title={`${day.date}: ${day.count} reviews`}
                >
                  <div
                    className="activity-bar"
                    style={{
                      height: day.count === 0
                        ? '0%'
                        : `${Math.max(
                            8,
                            (day.count / maxDailyReviews) * 100
                          )}%`,
                    }}
                  />
                </div>

                <span>{day.date.slice(8, 10)}</span>
              </div>
            ))}
          </div>

          <p className="activity-caption">
            Daily reviews · {stats?.timezone || 'Asia/Kolkata'}
          </p>
        </section>

        {selectedDeck && (
          <section className="panel mcq-panel">
            <CardForm
              deckId={selectedDeck.id}
              onCreated={handleCardCreated}
              onCancel={() => {
                setSelectedDeck(null)
                setError('')
              }}
            />
          </section>
        )}

        <div className="content-grid">
          <section className="panel decks-panel" id="decks">
            <div className="panel-heading">
              <div>
                <h2>Your decks</h2>
                <p>Pick a collection to review its cards.</p>
              </div>

              <span className="count-pill">
                {decks.length} decks
              </span>
            </div>

            {decks.length === 0 ? (
              <div className="empty-state">
                <span>▤</span>
                <h3>No decks yet</h3>
                <p>
                  Create your first deck to start learning.
                </p>
              </div>
            ) : (
              <div className="deck-list">
                {decks.map((deck, index) => (
                  <article
                    className="deck-item"
                    key={deck.id}
                  >
                    <div className={`deck-icon deck-color-${index % 4}`}>
                      {deck.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>

                    <div className="deck-details">
                      <h3>{deck.name}</h3>

                      <p>
                        {deck.description ||
                          'Keep practising and build your memory.'}
                      </p>
                    </div>

                    <div className="deck-actions">
                      <span className="deck-card-count">
                        {deck._count?.cards || 0} cards
                      </span>

                      <button
                        className="add-mcq-button"
                        onClick={() => {
                          setError('')
                          setShowCreateDeck(false)
                          setSelectedDeck(deck)
                        }}
                      >
                        + Add MCQ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel study-panel" id="study">
            <div className="panel-heading">
              <div>
                <h2>Study session</h2>
                <p>Your next card is waiting.</p>
              </div>

              <span className="study-indicator">
                ● Ready
              </span>
            </div>

            {activeCard ? (
              <div className="flashcard">
                <div className="flashcard-meta">
                  <span>
                    {activeCard.deck?.name || 'Your deck'}
                  </span>

                  <span>
                    {studyQueue.findIndex(
                      (card) => card.id === activeCard.id
                    ) + 1}
                    {' / '}
                    {studyQueue.length}
                  </span>
                </div>

                <h3>{activeCard.question}</h3>

                <div className="answer-options">
                  {activeCard.options.map((option, index) => (
                    <div
                      className={`answer-option ${
                        showAnswer &&
                        option === activeCard.correctAnswer
                          ? 'correct-option'
                          : ''
                      }`}
                      key={`${activeCard.id}-${option}`}
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option}</span>

                      {showAnswer &&
                        option === activeCard.correctAnswer && (
                          <span className="correct-mark">✓</span>
                        )}
                    </div>
                  ))}
                </div>

                {showAnswer && (
                  <div className="answer-explanation">
                    <strong>
                      Correct answer: {activeCard.correctAnswer}
                    </strong>

                    {activeCard.explanation && (
                      <p>{activeCard.explanation}</p>
                    )}
                  </div>
                )}

                {!showAnswer ? (
                  <button
                    className="primary-button reveal-button"
                    onClick={() => setShowAnswer(true)}
                  >
                    Reveal answer <span>→</span>
                  </button>
                ) : (
                  <div className="rating-section">
                    <p>How well did you remember?</p>

                    <div className="rating-buttons">
                      <button
                        disabled={submitting}
                        className="rating-again"
                        onClick={() => submitRating('AGAIN')}
                      >
                        {submitting ? 'Saving...' : 'Again'}
                      </button>

                      <button
                        disabled={submitting}
                        className="rating-hard"
                        onClick={() => submitRating('HARD')}
                      >
                        Hard
                      </button>

                      <button
                        disabled={submitting}
                        className="rating-good"
                        onClick={() => submitRating('GOOD')}
                      >
                        Good
                      </button>

                      <button
                        disabled={submitting}
                        className="rating-easy"
                        onClick={() => submitRating('EASY')}
                      >
                        Easy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state study-empty">
                <span>✦</span>

                <h3>You're all caught up!</h3>

                <p>
                  No cards are waiting in today's queue. Come back
                  when your next cards are due.
                </p>

                <button
                  className="secondary-button"
                  onClick={loadDashboard}
                >
                  Check again
                </button>
              </div>
            )}
          </section>
        </div>

        <footer className="page-footer">
          <span>MindDeck</span>
          <span>Build a habit. Remember more.</span>
        </footer>
      </section>
    </main>
  )
}

export default App
