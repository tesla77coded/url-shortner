import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

import shortenRouter from './routes/shorten.js';
import redirectRouter from './routes/redirect.js';

const app = express();
app.use(express.json());

app.use('/', redirectRouter);
app.use('/api', shortenRouter);


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
});
