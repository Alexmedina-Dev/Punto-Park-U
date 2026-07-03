const mongoose = require('mongoose');

async function clearReservations() {
  try {
    await mongoose.connect('mongodb+srv://puntoparku_admin:1bu2S9i93ZBzQZPl@punto-park-u.xtv5x8u.mongodb.net/punto-park-u?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');
    
    // Clear reservations collection
    const result = await mongoose.connection.collection('reservations').deleteMany({});
    console.log('Cleared ' + result.deletedCount + ' reservations');
    
    // Clear tickets collection (QR codes linked to reservations)
    const ticketsResult = await mongoose.connection.collection('tickets').deleteMany({});
    console.log('Cleared ' + ticketsResult.deletedCount + ' tickets');
    
    // Reset all parking spots to 'libre' (available)
    const spotsResult = await mongoose.connection.collection('parkingspots').updateMany(
      {}, 
      { '$set': { status: 'libre' } }
    );
    console.log('Reset ' + spotsResult.modifiedCount + ' parking spots to available');
    
    console.log('Done! All spaces are now available for the presentation.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

clearReservations();
