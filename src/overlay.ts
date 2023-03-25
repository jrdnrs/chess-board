import { EnPassant, Move, Position } from "./move";

export class Overlay {
    element: HTMLElement;
    squares: HTMLElement[];

    constructor(container: HTMLElement) {
        this.element = document.createElement("div");
        this.element.id = "overlay";
        this.squares = Array.from(new Array(64), () => {
            const el = document.createElement("div");
            el.classList.add("square");
            this.element.appendChild(el);
            return el;
        });

        container.appendChild(this.element);
    }

    clearAllHighlights() {
        for (const el of this.squares) {
            el.classList.value = "square";
        }
    }

    clearLegalMoveHighlights() {
        for (const el of this.squares) {
            el.classList.remove("start", "dest", "capture");
        }
    }

    clearPreviousMoveHighlights() {
        for (const el of this.squares) {
            el.classList.remove("last-move");
        }
    }

    clearCheckHighlight() {
        for (const el of this.squares) {
            el.classList.remove("check");
        }
    }

    hidePromotionSelection(square: Position) {
        this.element.style.zIndex = "";

        for (const el of this.squares) {
            el.classList.remove("dim");
        }

        if (square.rank === 7) {
            this.squares[square.index].classList.remove("white-queen", "promote");
            this.squares[square.index - 8].classList.remove("white-knight", "promote");
            this.squares[square.index - 16].classList.remove("white-rook", "promote");
            this.squares[square.index - 24].classList.remove("white-bishop", "promote");
        } else if (square.rank === 0) {
            this.squares[square.index].classList.remove("black-queen", "promote");
            this.squares[square.index + 8].classList.remove("black-knight", "promote");
            this.squares[square.index + 16].classList.remove("black-rook", "promote");
            this.squares[square.index + 24].classList.remove("black-bishop", "promote");
        }
    }

    highlightLegalMoves(start: Position, moves: Move[]) {
        this.squares[start.index].classList.add("start");
        for (const move of moves) {
            if (move.capture || move.enPassant === EnPassant.Capture) {
                this.squares[move.to.index].classList.add("capture");
            } else {
                this.squares[move.to.index].classList.add("dest");
            }
        }
    }

    highlightPreviousMove(from: Position, to: Position) {
        this.squares[from.index].classList.add("last-move");
        this.squares[to.index].classList.add("last-move");
    }

    highlightCheck(square: Position) {
        this.squares[square.index].classList.add("check");
    }

    showPromotionSelection(square: Position) {
        this.element.style.zIndex = "4";

        for (const el of this.squares) {
            el.classList.add("dim");
        }

        if (square.rank === 7) {
            this.squares[square.index].classList.add("white-queen", "promote");
            this.squares[square.index - 8].classList.add("white-knight", "promote");
            this.squares[square.index - 16].classList.add("white-rook", "promote");
            this.squares[square.index - 24].classList.add("white-bishop", "promote");
        } else if (square.rank === 0) {
            this.squares[square.index].classList.add("black-queen", "promote");
            this.squares[square.index + 8].classList.add("black-knight", "promote");
            this.squares[square.index + 16].classList.add("black-rook", "promote");
            this.squares[square.index + 24].classList.add("black-bishop", "promote");
        }
    }
}
