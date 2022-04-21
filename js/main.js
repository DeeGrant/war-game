init()

function init() {
    document.getElementById('winner').hidden = true
    document.getElementById('war').hidden = true
    startGame()
        .then(result => console.log(`started game using deck: ${result}`))
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

class Game {
    constructor(deckId, hand1, hand2) {
        this.deckId = deckId;
        this.hand1 = hand1;
        this.hand2 = hand2;
        this.pile = [];
        this.isWar = false;
        this.round = 0;
        this._score1 = 0;
        this._score2 = 0;
        this._isWinner = false;
    }

    get score1() {
        return this._score1
    }
    set score1(score) {
        this._score1 = score
        document.querySelector(`#hand1 span`).innerHTML = this._score1
        if (score === 52) {
            this._isWinner = true;
        }
    }

    get score2() {
        return this._score2
    }
    set score2(score) {
        this._score2 = score
        document.querySelector(`#hand2 span`).innerHTML = this._score2
        if (score === 52) {
            this._isWinner = true;
        }
    }

    async dealTheDeck() {
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=52`)
            let data = await response.json()

            let cards = data.cards.map(card => card.code)

            let hand1 = cards.filter((element, index) => index % 2 === 0)
            let hand2 = cards.filter((element, index) => index % 2 === 1)

            let data1 = await this.AddToHand(this.hand1, hand1)
            let data2 = await this.AddToHand(this.hand2, hand2)

            this.updateUI(data2, "img/back-final.png", "img/back-final.png")
        } catch (e) {
            console.log(e)
        }
    }

    addCardsToPile(cards) {
        // TODO shuffle? here?
        this.pile.push(...cards)
    }

    async addPileToHand(hand) {
        try {
            let res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/add/?cards=${this.pile.join(',')}`)
            let data = await res.json()

            if (!data.success) {
                // ??
            }
            this.pile = []
            // await this.viewHands()
            return data
        } catch (e) {
            console.log(e)
        }
    }

    async drawCards(){ // is war parameter?
        // serial requests
        try {
            this.round++

            let drawNumber = 1
            if (this.isWar) {
                drawNumber = 4
            }

            let data1 = await this.drawCard(this.hand1, drawNumber)
            let data2 = await this.drawCard(this.hand2, drawNumber)

            let compareCard1 = data1.cards[data1.cards.length-1]
            let compareCard2 = data2.cards[data2.cards.length-1]

            this.addCardsToPile([...data1.cards.map(card => card.code), ...data2.cards.map(card => card.code)])

            let winner = this.compareCards(compareCard1.value, compareCard2.value)

            if (this.isWar) {
                this.clearHighlight()
                this.updateUI(data2, compareCard1.image, compareCard2.image)
                return
            }

            let res = await this.addPileToHand(winner)
            this.highlightWinner(winner)
            this.updateUI(res, compareCard1.image, compareCard2.image)

            if (this._isWinner) {
                this.isWinner()
            }
        } catch (e) {
            console.log(e)
        }
    }

    async drawCard(hand, count= 1) {
        // alt compare to current score
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/draw/bottom/?count=${count}`)
            if (response.ok) {
                return await response.json()
            } else if (response.status === 404) {
                return await this.drawCard(hand, --count)
            }
        } catch (e) {
            console.log(e)
        }
    }

    async AddToHand(hand, cards) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deckId}/pile/${hand}/add/?cards=${cards.join(',')}`)
        let data = await response.json()
        this.updateScore(hand, data.piles[hand].remaining)
        return data
    }

    updateScore(hand, score) {
        const span = document.querySelector(`#${hand} span`)
        span.innerText = score
        this[`${hand}_score`] = score
    }

    updateCard(hand, card_url){
        document.querySelector(`#${hand} img`).src = card_url
    }

    compareCards(value1, value2) {
        value1 = this.convertCardValue(value1)
        value2 = this.convertCardValue(value2)

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

    updateUI(res, card1_url, card2_url) {
        document.getElementById('war').hidden = !this.isWar
        this.updateRound()

        this.updateCard(this.hand1, card1_url)
        this.updateCard(this.hand2, card2_url)

        this.score1 = res.piles[this.hand1].remaining
        this.score2 = res.piles[this.hand2].remaining
    }

    updateRound() {
        document.querySelector('h4 span').innerHTML = this.round
    }

    isWinner() {
        document.querySelector('button').disabled = true
        let heading = document.getElementById('winner')
        heading.hidden = false
        heading.innerHTML = `${this._score1 === 52 ? 'Player 1' : 'Player 2'} Wins!`
    }

    highlightWinner(winner) {
        this.clearHighlight()

        let img = document.querySelector(`#${winner} img`)
        img.style['background'] = 'darkred'
        img.style['box-shadow'] = '.1rem .1rem 0 darkred'
    }
    clearHighlight() {
        let one = document.querySelector('#hand1 img')
        one.style['background'] = 'none'
        one.style['box-shadow'] = 'none'
        let two = document.querySelector('#hand2 img')
        two.style['background'] = 'none'
        two.style['box-shadow'] = 'none'
    }
}
