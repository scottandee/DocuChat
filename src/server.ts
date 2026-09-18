import app from './app.ts';
import { config } from './lib/config.ts';

const port = config.PORT;
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});