const card1 = document.querySelector('#player1 img')
const card2 = document.querySelector('#player2 img')

class Game {
    constructor(deckId, hand1, hand2, pile) {
        this.deckId = deckId;
        this.hand1 = hand1;
        this.hand2 = hand2;
        this.pile = pile;
    }
    async dealTheDeck() {
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=52`)
            let data = await response.json()
            let cards = data.cards.map(card => card.code)
            console.log(cards)
            let hand1 = cards.filter((element, index) => index % 2 === 0)
            let hand2 = cards.filter((element, index) => index % 2 === 1)
            console.log(hand1)
            console.log(hand2)

        } catch (e) {
            console.log(e)
        }
    }
    async addToPile(pile) {

    }
    async drawCards(){
        console.log('yay me!')
        console.log(this)
    }
    AddToHand(hand, cards) {

    }
}

async function startGame() {
    let deckId = await getDeckId()
    let game = new Game(deckId, 'hand1', 'hand2', 'inPlay')
    await game.dealTheDeck()

    document.querySelector('#draw').addEventListener('click', () => {game.drawCards()})
    return deckId
}

async function getDeckId() {
    try {
        let response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
        let data = await response.json()
        return data.deck_id
    } catch (e) {
        console.log(e)
    }
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

function init() {
    startGame()
        .then(result => console.log(`started game using deck: ${result}`))
}
init()