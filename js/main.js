document.querySelector('button').addEventListener('click', drawCards)

let DECK_ID = ''
const card1 = document.querySelector('#player1 img')
const card2 = document.querySelector('#player2 img')
const hand1 = 'hand1'
const hand2 = 'hand2'
const inPlay = 'inPlay'

// Get Deck
fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(res => res.json()) // parse response as JSON
    .then(data => {
        console.log(data)
        DECK_ID = data.deck_id
        console.log(DECK_ID)
        dealCards()
    })
    .catch(err => {
        console.log(`error ${err}`)
    });

function dealCards() {
    let remaining = 52

    while (remaining > 0) {
        fetch(`https://deckofcardsapi.com/api/deck/${DECK_ID}/draw/?count=2`)
            .then(res => res.json()) // parse response as JSON
            .then(data => {
                console.log(data)
                addCardToHand(data.cards[0].code, hand1)
                addCardToHand(data.cards[1].code, hand2)
            })
            .catch(err => {
                console.log(`error ${err}`)
            });
    }

    console.log('dealing done')
}

function drawCards() {
    drawCardFromHand(hand1)
    drawCardFromHand(hand2)

    fetch(`https://deckofcardsapi.com/api/deck/${DECK_ID}/draw/?count=2`)
        .then(res => res.json()) // parse response as JSON
        .then(data => {
            console.log(data)
            // TODO svgs instead of pngs
            card1.src = data.cards[0].image
            card2.src = data.cards[1].image
        })
        .catch(err => {
            console.log(`error ${err}`)
        });
}

function getFetch(){
  const choice = document.querySelector('input').value
  const url = 'https://pokeapi.co/api/v2/pokemon/'+choice

  fetch(url)
      .then(res => res.json()) // parse response as JSON
      .then(data => {
        console.log(data)
      })
      .catch(err => {
          console.log(`error ${err}`)
      });
}

async function newDeck() {
    try {
        let deck = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        return deck.deck_id
    } catch (e) {
        console.log(e)
    }
}

function createGame() {
    // fetch deckId

    return new Game()
}

class Game {
    constructor(deckId, pile1, pile2, pile3) {
        this.deckId = deckId;
        this.pile1 = pile1;
        this.pile2 = pile2;
        this.pile3 = pile3;
    }
}
