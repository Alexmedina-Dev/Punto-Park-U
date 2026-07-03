const mongoose = require('mongoose');

async function seedParkingSpots() {
  try {
    await mongoose.connect('mongodb+srv://puntoparku_admin:1bu2S9i93ZBzQZPl@punto-park-u.xtv5x8u.mongodb.net/punto-park-u?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');
    
    const ParkingSpot = mongoose.connection.collection('parkingspots');
    
    // Check if spots already exist
    const existing = await ParkingSpot.countDocuments();
    if (existing > 0) {
      console.log('Parking spots already exist:', existing);
      process.exit(0);
    }
    
    // Create parking spots
    const spots = [];
    
    // Zone A - Carros (20 spots)
    for (let i = 1; i <= 20; i++) {
      spots.push({
        code: `A${String(i).padStart(2, '0')}`,
        zone: 'A',
        type: 'car',
        status: 'libre',
        floor: 1,
        accessible: i <= 2, // First 2 are accessible
        createdAt: new Date()
      });
    }
    
    // Zone B - Motos (20 spots)
    for (let i = 1; i <= 20; i++) {
      spots.push({
        code: `B${String(i).padStart(2, '0')}`,
        zone: 'B',
        type: 'moto',
        status: 'libre',
        floor: 1,
        accessible: false,
        createdAt: new Date()
      });
    }
    
    // Zone C - Bicicletas (10 spots)
    for (let i = 1; i <= 10; i++) {
      spots.push({
        code: `C${String(i).padStart(2, '0')}`,
        zone: 'C',
        type: 'bike',
        status: 'libre',
        floor: 1,
        accessible: false,
        createdAt: new Date()
      });
    }
    
    // Zone D - Camionetas (5 spots)
    for (let i = 1; i <= 5; i++) {
      spots.push({
        code: `D${String(i).padStart(2, '0')}`,
        zone: 'D',
        type: 'camioneta',
        status: 'libre',
        floor: 1,
        accessible: false,
        createdAt: new Date()
      });
    }
    
    const result = await ParkingSpot.insertMany(spots);
    console.log('Created ' + result.length + ' parking spots');
    console.log('Zones: A (Carros), B (Motos), C (Bicicletas), D (Camionetas)');
    console.log('All spots are available (libre) for the presentation!');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedParkingSpots();
