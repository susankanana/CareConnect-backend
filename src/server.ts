import app from './index';
import "dotenv/config"

// app.listen(8081, () => {
//   console.log('Server is running on http://localhost:8081');
// });

const PORT = process.env.PORT || 8081;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
