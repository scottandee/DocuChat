import 'dotenv/config';
import app from './app.ts';

const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});