class Game {
    constructor(deckId, hand1, hand2) {
        this.deckId = deckId;
        this.hand1 = hand1;
        this.hand2 = hand2;
        this.pile = [];
    }
    async dealTheDeck() {
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=52`)
            let data = await response.json()
            let cards = data.cards.map(card => card.code)
            console.log(cards)
            let hand1 = cards.filter((element, index) => index % 2 === 0)
            let hand2 = cards.filter((element, index) => index % 2 === 1)
            let res1 = await this.AddToHand(this.hand1, hand1)
            let res2 = await this.AddToHand(this.hand2, hand2)
        } catch (e) {
            console.log(e)
        }
    }
    addCardsToPile(cards) {
        // shuffle?
        this.pile.push(...cards)
        console.log('pile', this.pile)
    }
    async addPileToHand(hand) {
        try {
            let res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/add/?cards=${this.pile.join(',')}`)
            let data = await res.json()

            if (data.success) {
                this.pile = []
            } else {
                // failure modes
            }
            return data
        } catch (e) {
            console.log(e)
        }
    }
    async drawCards(){ // is war parameter?
        // serial requests
        try {
            let data1 = await this.drawCard(this.hand1) // add card count?
            let data2 = await this.drawCard(this.hand2)
            let card1 = data1.cards[0]
            let card2 = data2.cards[0]
            this.updateCard(this.hand1, card1.image)
            this.updateCard(this.hand2, card2.image)
            this.addCardsToPile([card1.code, card2.code])
            let winner = this.compareCards(card1.value, card2.value)
            console.log('winner! ', winner)
            let res = await this.addPileToHand(winner)
            this.updateScore(this.hand1, res.piles[this.hand1].remaining)
            this.updateScore(this.hand2, res.piles[this.hand2].remaining)

        } catch (e) {
            console.log(e)
        }
    }
    async drawCard(hand) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/draw/bottom/?count=1`)
        return await response.json()
    }
    async AddToHand(hand, cards) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/add/?cards=${cards.join(',')}`)
        let data = await response.json()
        console.log(data)
        console.log(hand, data.piles[hand].remaining)
        this.updateScore(hand, data.piles[hand].remaining)
    }
    updateScore(hand, score) {
        const span = document.querySelector(`#${hand} span`)
        span.innerText = score
        this[`${hand}_scare`] = score
    }
    updateCard(hand, card_url){
        document.querySelector(`#${hand} img`).src = card_url
    }
    compareCards(value1, value2) {
        // TODO
        if (typeof value1 !== 'number') {
            value1 = this.convertFaceCard(value1)
        }
        if (typeof value2 !== 'number') {
            value2 = this.convertFaceCard(value2)
        }
        console.log('values: ', value1, value2)
        // check for war
        return value1 > value2 ? this.hand1 : this.hand2;
    }
    convertFaceCard(value) {
        switch (value) {
            case 'JACK':
                return 11
            case 'QUEEN':
                return 12
            case 'KING':
                return 13
            case 'ACE':
                return 14
            default:
                return value
        }
    }
}

async function startGame() {
    let deckId = await getDeckId()
    let game = new Game(deckId, 'hand1', 'hand2')
    let res = await game.dealTheDeck()
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

function init() {
    startGame()
        .then(result => console.log(`started game using deck: ${result}`))
}
init()