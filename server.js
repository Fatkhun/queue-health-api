
const express = require('express');
const pasienRoutes = require('./routes/pasienRoutes');
const authRoutes = require('./routes/authRoutes');
const responseWrapper = require('./middleware/responseWrapper'); // Import responseWrapper middleware
const cors = require('cors');

const app = express();
app.use(express.json());  // Parsing body JSON
app.use(cors());  // Enable Cross-Origin Request

// Apply the response wrapper middleware
app.use(responseWrapper);

// Use authentication routes
app.use('/api/auth', authRoutes);

// Use pasien routes
app.use('/api/pasien', pasienRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server berjalan di port \${PORT}\`);
});
    