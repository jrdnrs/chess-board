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
        this.element.style.zIndex = "";
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
        let squares: number[];
        let color: string;

        if (square.rank === 7) {
            squares = [square.index, square.index - 8, square.index - 16, square.index - 24];
            color = "white";
        } else if (square.rank === 0) {
            squares = [square.index, square.index + 8, square.index + 16, square.index + 24];
            color = "black";
        } else {
            throw new Error(`Invalid promotion on square '${square}'`);
        }

        this.element.style.zIndex = "";

        for (const el of this.squares) {
            el.classList.remove("dim");
        }

        this.squares[squares[0]].classList.add(color + "-queen", "promote");
        this.squares[squares[1]].classList.add(color + "-knight", "promote");
        this.squares[squares[2]].classList.add(color + "-rook", "promote");
        this.squares[squares[3]].classList.add(color + "-bishop", "promote");
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

    showPromotionSelection(square: Position): number[] {
        let squares: number[];
        let color: string;

        if (square.rank === 7) {
            squares = [square.index, square.index - 8, square.index - 16, square.index - 24];
            color = "white";
        } else if (square.rank === 0) {
            squares = [square.index, square.index + 8, square.index + 16, square.index + 24];
            color = "black";
        } else {
            throw new Error(`Invalid promotion on square '${square}'`);
        }

        this.element.style.zIndex = "4";

        for (const el of this.squares) {
            el.classList.add("dim");
        }

        this.squares[squares[0]].classList.add(color + "-queen", "promote");
        this.squares[squares[1]].classList.add(color + "-knight", "promote");
        this.squares[squares[2]].classList.add(color + "-rook", "promote");
        this.squares[squares[3]].classList.add(color + "-bishop", "promote");

        return squares;
    }
}
