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
            await this.AddToHand(this.hand1, hand1)
            await this.AddToHand(this.hand2, hand2)
        } catch (e) {
            console.log(e)
        }
    }
    async addToPile(pile) {

    }
    async drawCards(){
        // TODO api doesn't fully handle parallel requests?
        // parallel requests
        try {
            let data1 = this.drawCard(this.hand1)
            let data2 = this.drawCard(this.hand2)
            let data = await Promise.all([data1, data2])
            this.updateCard(this.hand1, data[0].cards[0].image)
            this.updateCard(this.hand2, data[1].cards[0].image)
        } catch (e) {
            console.log(e)
        }

        //     // serial requests
        // try {
        //     let data1 = await this.drawCard(this.hand1)
        //     let data2 = await this.drawCard(this.hand2)
        //     this.updateCard(this.hand1, data1.cards[0].image)
        //     this.updateCard(this.hand2, data2.cards[0].image)
        // } catch (e) {
        //     console.log(e)
        // }
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
        let img = document.querySelector(`#${hand} img`)
        console.log(img)
        img.src = card_url
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

function init() {
    startGame()
        .then(result => console.log(`started game using deck: ${result}`))
}
init()