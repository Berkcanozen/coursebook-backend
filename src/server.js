import { createApp } from './app.js';
import { config } from './config.js';
import { getDb } from './db/connection.js';

getDb(); // open connection + ensure schema
createApp().listen(config.port, () => {
  console.log(`Coursebook API listening on http://localhost:${config.port}`);
});
