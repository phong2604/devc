import React, { useState } from "react";
import { FlashcardArray } from "react-quizlet-flashcard";

function Deck() {
  const [cards, setCards] = useState([]); // State to store fetched flashcards
  const [loading, setLoading] = useState(false); // State for loading status
  const [error, setError] = useState(null); // State for error handling

  const fetchFlashcards = async () => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const response = await fetch("https://dvryun8duj.execute-api.us-east-1.amazonaws.com/dev/card");
      if (!response.ok) {
        throw new Error("Failed to fetch flashcards");
      }
      const data = await response.json();
      const formattedCards = data.cards.map((card) => ({
        id: card.cardid, // Use cardid from response as the unique ID
        frontHTML: <>{card.frontHTML}</>, // Directly use the frontHTML content
        backHTML: <>{card.backHTML}</>, // Directly use the backHTML content
      }));
      setCards(formattedCards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={fetchFlashcards} disabled={loading}>
        {loading ? "Syncing..." : "Sync"}
      </button>
      {error && <div>Error: {error}</div>}
      {cards.length > 0 ? (
        <FlashcardArray cards={cards} />
      ) : (
        <div>{!loading && !error && "No flashcards available. Click Sync to load."}</div>
      )}
    </div>
  );
}

export default Deck;
