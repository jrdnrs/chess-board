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

const game = new Game(document.body);
const debugEl = document.querySelector("#debug")!;

const btn1 = document.createElement("button");
btn1.innerHTML = "start";
debugEl.appendChild(btn1);
btn1.addEventListener(
    "click",
    (e) => {
        const playerOne = Number.parseInt((debugEl.querySelector("#sel1") as HTMLSelectElement).value);
        const playerTwo = Number.parseInt((debugEl.querySelector("#sel2") as HTMLSelectElement).value);
        game.start(playerOne, playerTwo);

        const btn2 = document.createElement("button");
        btn2.innerHTML = "get legal moves";
        debugEl.appendChild(btn2);
        btn2.addEventListener("click", async (e) => {
            console.log(await game.getLegalMoves());
        });

        const btn3 = document.createElement("button");
        btn3.innerHTML = "get best move";
        debugEl.appendChild(btn3);
        btn3.addEventListener("click", async (e) => {
            const moves = await game.getBestMove(5);
            console.log(moves);
        });

        const btn4 = document.createElement("button");
        btn4.innerHTML = "flip";
        debugEl.appendChild(btn4);
        btn4.addEventListener("click", (e) => {
            game.board.flipBoard();
        });

        btn1.remove();
    },
    { once: true }
);
