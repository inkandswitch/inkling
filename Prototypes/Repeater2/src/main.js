import engine from './engine';
import Canvas from './canvas';
import App from './app/App';


const app = new App();

console.log("hello world");

const canvas = new Canvas(document.body, ctx => {
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
  app.render(ctx);
});

engine((events) => {
  app.update(events);
  //relax();
  canvas.render();
});