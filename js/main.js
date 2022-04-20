class Game {
    constructor(deckId, hand1, hand2) {
        this.deckId = deckId;
        this.hand1 = hand1;
        this.hand2 = hand2;
        this.pile = [];
        this.isWar = false;
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
        // TODO shuffle? here?
        this.pile.push(...cards)
        console.log('pile', this.pile)
    }

    async addPileToHand(hand) {
        try {
            let res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/add/?cards=${this.pile.join(',')}`)
            let data = await res.json()

            if (data.success) {
                this.pile = []
                await this.viewHands()
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
            let drawNumber = 1
            if (this.isWar) {
                drawNumber = 4
            }

            let data1 = await this.drawCard(this.hand1, drawNumber)
            let data2 = await this.drawCard(this.hand2, drawNumber)

            let compareCard1 = data1.cards[data1.cards.length-1]
            let compareCard2 = data2.cards[data2.cards.length-1]
            console.log('Compare Cards: ', compareCard1, compareCard2)

            this.updateCard(this.hand1, compareCard1.image)
            this.updateCard(this.hand2, compareCard2.image)

            this.addCardsToPile([...data1.cards.map(card => card.code), ...data2.cards.map(card => card.code)])

            let winner = this.compareCards(compareCard1.value, compareCard2.value)
            console.log('winner! ', winner)
            if (this.isWar) {
                return
            }

            let res = await this.addPileToHand(winner)
            this.updateScore(this.hand1, res.piles[this.hand1].remaining)
            this.updateScore(this.hand2, res.piles[this.hand2].remaining)

        } catch (e) {
            console.log(e)
        }
    }

    async drawCard(hand, count=1) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/draw/bottom/?count=${count}`)
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
        value1 = this.convertCardValue(value1)
        value2 = this.convertCardValue(value2)
        console.log('values: ', typeof value1, value1, typeof value2, value2)

        // check for war
        if (value1 === value2) {
            this.isWar = true
            return 'war'
        }

        this.isWar = false
        return value1 > value2 ? this.hand1 : this.hand2;
    }

    convertCardValue(value) {
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
                return Number(value)
        }
    }

    async viewHands() {
        let hand1 = await this.getHand(this.hand1)
        console.log('hand 1 ', hand1.cards.map(card => card.value))
        let hand2 = await this.getHand(this.hand2)
        console.log('hand 2 ', hand2.cards.map(card => card.value))
    }

    async getHand(hand) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/list/`)
        let data = await response.json()
        return data.piles[hand]
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