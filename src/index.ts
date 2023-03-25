// @ts-ignore
if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    const hot = module.hot;
    if (hot) {
        hot.dispose(() => {
            window.location.reload();
            throw "hotReload";
        });
    }
}

import { Game } from "./game";
import { Position } from "./move";

const game = new Game(document.body);

const btn1 = document.createElement("button");
btn1.innerHTML = "get legal moves";
document.body.appendChild(btn1);
btn1.addEventListener("click", async (e) => {
    const moves = await game.getLegalMoves();
    console.log(moves);
});

const btn2 = document.createElement("button");
btn2.innerHTML = "get best move";
document.body.appendChild(btn2);
btn2.addEventListener("click", async (e) => {
    const moves = await game.getBestMove();
    console.log(moves);
});

const btn3 = document.createElement("button");
btn3.innerHTML = "flip";
document.body.appendChild(btn3);
btn3.addEventListener("click", (e) => {
    game.board.flipBoard();
});

const btn4 = document.createElement("button");
btn4.innerHTML = "test";
document.body.appendChild(btn4);
btn4.addEventListener("click", (e) => {
    game.board.overlay.showPromotionSelection(new Position(4, 7))
});
