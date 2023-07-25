import engine from "./engine";
import App from "./app/App";

const app = new App();

engine((events) => {
  app.update(events);
  app.render();
});