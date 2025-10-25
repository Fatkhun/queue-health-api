
const express = require('express');
const pasienRoutes = require('./routes/pasienRoutes');
const authRoutes = require('./routes/authRoutes');
const pengaturanLayananRoutes = require('./routes/pengaturanLayananRoutes');
const poliRoutes = require('./routes/poliRoutes');
const pendaftaranRoutes = require('./routes/pendaftaranRoutes');
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

app.use('/api/layanan', pengaturanLayananRoutes);

app.use('/api/poli', poliRoutes);

app.use('/api/daftar', pendaftaranRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server berjalan di port " + PORT)
});
    