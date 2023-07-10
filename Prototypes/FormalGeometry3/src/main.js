import engine from './engine';
import app from './app';
import './view';

// LOOP
engine((events) => {
    app.update(events)

    // draw.update(events);
    // relax();
    // canvas.render();
    
});