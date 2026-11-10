import { useState } from 'react'
import { apiFetch } from './api'

function CardForm({ deckId, onCreated, onCancel }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [explanation, setExplanation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateOption(index, value) {
    const updatedOptions = [...options]
    updatedOptions[index] = value
    setOptions(updatedOptions)

    if (correctAnswer === options[index]) {
      setCorrectAnswer('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const cleanQuestion = question.trim()
    const cleanOptions = options.map((option) => option.trim())

    if (!cleanQuestion) {
      setError('Please enter a question.')
      return
    }

    if (cleanOptions.some((option) => !option)) {
      setError('Please fill in all four options.')
      return
    }

    if (new Set(cleanOptions).size !== cleanOptions.length) {
      setError('Each option must be different.')
      return
    }

    if (!cleanOptions.includes(correctAnswer)) {
      setError('Please select the correct answer.')
      return
    }

    try {
      setSaving(true)
      setError('')

      await apiFetch('/cards', {
        method: 'POST',
        body: JSON.stringify({
          deckId,
          question: cleanQuestion,
          options: cleanOptions,
          correctAnswer,
          explanation: explanation.trim(),
        }),
      })

      onCreated()
    } catch (err) {
      setError(err.message || 'Could not connect to the server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <div className="card-form-heading">
        <div>
          <h3>Add a multiple-choice question</h3>
          <p>Create a question with four possible answers.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <label htmlFor="mcq-question">Question</label>
      <textarea
        id="mcq-question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Enter your question..."
        maxLength={1000}
        rows={3}
        required
      />

      <fieldset className="options-fieldset">
        <legend>Answer options</legend>

        {options.map((option, index) => (
          <div className="card-option-field" key={index}>
            <label htmlFor={`mcq-option-${index}`}>
              Option {String.fromCharCode(65 + index)}
            </label>

            <input
              id={`mcq-option-${index}`}
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
              maxLength={300}
              required
            />
          </div>
        ))}
      </fieldset>

      <label htmlFor="mcq-answer">Correct answer</label>
      <select
        id="mcq-answer"
        value={correctAnswer}
        onChange={(event) => setCorrectAnswer(event.target.value)}
        required
      >
        <option value="">Select the correct answer</option>
        {options.map((option, index) => (
          <option
            key={index}
            value={option}
            disabled={!option.trim() || options.indexOf(option) !== index}
          >
            {String.fromCharCode(65 + index)}
            {option.trim() ? ` — ${option}` : ' — Enter this option first'}
          </option>
        ))}
      </select>

      <label htmlFor="mcq-explanation">
        Explanation <span className="optional-label">(optional)</span>
      </label>
      <textarea
        id="mcq-explanation"
        value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
        placeholder="Explain why this answer is correct..."
        maxLength={1000}
        rows={2}
      />

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Saving question...' : 'Save flashcard'}
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default CardForm