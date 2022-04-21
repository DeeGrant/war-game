init()

function init() {
    document.getElementById('winner').hidden = true
    document.getElementById('war').hidden = true
    startGame()
        .then(result => console.log(`started game using deck: ${result}`))
}

async function startGame() {
    let deck_id = await getDeckId()
    let player1_scoreboard = document.querySelector(`#hand1 span`)
    let player2_scoreboard = document.querySelector(`#hand2 span`)
    let player1_card = document.querySelector('#hand1 img')
    let player2_card = document.querySelector('#hand2 img')
    let button = document.querySelector('button')
    let war = document.getElementById('war')
    let winner = document.getElementById('winner')
    let rounds_board = document.querySelector('h4 span')

    let game = new Game(
        deck_id,
        'Alice',
        'Bob',
        player1_scoreboard,
        player2_scoreboard,
        player1_card,
        player2_card,
        button,
        war,
        winner,
        rounds_board)
    let res = await game.dealTheDeck()

    button.addEventListener('click', () => {game.playersDrawCards()})
    return deck_id
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
    constructor(deck_id, player_1_name, player_2_name, scoreboard_1, scoreboard_2, card_1, card_2, button, war, winner, rounds_board) {
        this.deck_id = deck_id;
        this._player_1_name = player_1_name;
        this._player_2_name = player_2_name;
        this._scoreboard_1 = scoreboard_1
        this._scoreboard_2 = scoreboard_2
        this._card_1 = card_1
        this._card_2 = card_2
        this._button = button
        this._war = war
        this._winner = winner
        this._rounds_board = rounds_board
        this.pile = [];
        this.is_war = false;
        this.round = 0;
        this._score_1 = 0;
        this._score_2 = 0;
        this._is_game_finished = false;
    }

    get score_1() {
        return this._score_1
    }
    set score_1(score) {
        this._score_1 = score
        this._scoreboard_1.innerHTML = this._score_1
        if (score === 52 || score < 1) {
            this._is_game_finished = true;
        }
    }

    get score_2() {
        return this._score_2
    }
    set score_2(score) {
        this._score_2 = score
        this._scoreboard_2.innerHTML = this._score_2
        if (score === 52 || score < 1) {
            this._is_game_finished = true;
        }
    }

    async dealTheDeck() {
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deck_id}/draw/?count=52`)
            let data = await response.json()

            let cards = data.cards.map(card => card.code)

            // for running test cases
            // let player_2_cards = [cards.pop(), cards.pop()]
            // let player_1_cards = cards
            let player_1_cards = cards.filter((element, index) => index % 2 === 0)
            let player_2_cards = cards.filter((element, index) => index % 2 === 1)

            let data1 = await this._addCardsToPlayerHand(this._player_1_name, player_1_cards)
            let data2 = await this._addCardsToPlayerHand(this._player_2_name, player_2_cards)

            this._updateUI(data2, "img/back-final.png", "img/back-final.png")
        } catch (e) {
            console.log(e)
        }
    }

    _addCardsToPile(cards) {
        // TODO shuffle? here?
        this.pile.push(...cards)
    }

    async _addPileToPlayerHand(player_name) {
        try {
            let res = await fetch(`https://deckofcardsapi.com/api/deck/${this.deck_id}/pile/${player_name}/add/?cards=${this.pile.join(',')}`)
            let data = await res.json()

            if (!data.success) {
                // ??
            }
            this.pile = []
            // for debugging
            // await this._viewPlayersHands()
            return data
        } catch (e) {
            console.log(e)
        }
    }

    async playersDrawCards(){
        try {
            this.round++

            let cards_to_draw = 1
            if (this.is_war) {
                cards_to_draw = 4
            }

            let data1 = await this._drawCards(this._player_1_name, cards_to_draw)
            let data2 = await this._drawCards(this._player_2_name, cards_to_draw)

            let player_1_card = data1.cards[data1.cards.length-1]
            let player_2_card = data2.cards[data2.cards.length-1]

            this._addCardsToPile([...data1.cards.map(card => card.code), ...data2.cards.map(card => card.code)])

            let winning_player = this._getWinningPlayerName(player_1_card, player_2_card)

            if (this.is_war) {
                this._removeCardHighlighting()
                this._updateUI(data2, player_1_card.image, player_2_card.image)
                return
            }

            let res = await this._addPileToPlayerHand(winning_player)

            this._removeCardHighlighting()
            this._highlightPlayerCard(winning_player)
            this._updateUI(res, player_1_card.image, player_2_card.image)

            if (this._is_game_finished) {
                this._displayWinner()
            }
        } catch (e) {
            console.log(e)
        }
    }

    async _drawCards(hand, count= 1) {
        // alt compare to current score
        try {
            let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deck_id}/pile/${hand}/draw/bottom/?count=${count}`)
            if (response.ok) {
                return await response.json()
            } else if (response.status === 404) {
                return await this._drawCards(hand, --count)
            }
        } catch (e) {
            console.log(e)
        }
    }

    async _addCardsToPlayerHand(player_name, cards) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deck_id}/pile/${player_name}/add/?cards=${cards.join(',')}`)
        let data = await response.json()
        this._updatePlayerScore(player_name, data.piles[player_name].remaining)
        return data
    }

    _updatePlayerScore(player_name, score) {
        let score_span = player_name === this._player_1_name ? this._scoreboard_1 : this._scoreboard_2
        score_span.innerText = score
    }

    _getWinningPlayerName(player_1_card, player_2_card) {
        let num_1 = this._cardValueToNumber(player_1_card.value)
        let num_2 = this._cardValueToNumber(player_2_card.value)

        if (num_1 === num_2) {
            this.is_war = true
            return 'war'
        }

        this.is_war = false
        return num_1 > num_2 ? this._player_1_name : this._player_2_name;
    }

    _cardValueToNumber(card_value) {
        switch (card_value) {
            case 'JACK':
                return 11
            case 'QUEEN':
                return 12
            case 'KING':
                return 13
            case 'ACE':
                return 14
            default:
                return Number(card_value)
        }
    }

    async _viewPlayersHands() {
        let player_1_cards = await this._getPlayerHand(this._player_1_name)
        console.log(this._player_1_name, player_1_cards.map(card => card.value))
        let player_2_cards = await this._getPlayerHand(this._player_2_name)
        console.log(this._player_2_name, player_2_cards.map(card => card.value))
    }

    async _getPlayerHand(player) {
        let response = await fetch(`https://deckofcardsapi.com/api/deck/${this.deck_id}/pile/${player}/list/`)
        let hand_data = await response.json()
        return hand_data.piles[player].cards
    }

    _updateUI(api_data, card_1_url, card_2_url) {
        this._war.hidden = !this.is_war
        this._rounds_board.innerHTML = this.round

        this._card_1.src = card_1_url
        this._card_2.src = card_2_url

        this.score_1 = api_data.piles[this._player_1_name].remaining
        this.score_2 = api_data.piles[this._player_2_name].remaining
    }

    _displayWinner() {
        this._button.disabled = true
        this._winner.hidden = false
        this._winner.innerHTML = `${this._score_1 > this._score_2 ? this._player_1_name : this._player_2_name} Wins!`
    }

    _highlightPlayerCard(player_name) {
        let img = player_name === this._player_1_name ? this._card_1 : this._card_2
        img.style['background'] = 'darkred'
        img.style['box-shadow'] = '.1rem .1rem 0 darkred'
    }

    _removeCardHighlighting() {
        this._card_1.style['background'] = 'none'
        this._card_1.style['box-shadow'] = 'none'
        this._card_2.style['background'] = 'none'
        this._card_2.style['box-shadow'] = 'none'
    }
}
