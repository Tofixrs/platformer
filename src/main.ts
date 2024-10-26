import { Game } from "./game";
import "./style.css";

const game = new Game();
//@ts-expect-error
window.game = game;
(async () => await game.run())();
