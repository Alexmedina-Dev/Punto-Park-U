const mongoose = require('mongoose');

async function checkCollections() {
  try {
    await mongoose.connect('mongodb+srv://puntoparku_admin:1bu2S9i93ZBzQZPl@punto-park-u.xtv5x8u.mongodb.net/punto-park-u?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(c => console.log('  - ' + c.name));
    
    // Check if reservations exist in any collection
    for (const coll of collections) {
      const count = await mongoose.connection.collection(coll.name).countDocuments();
      console.log(coll.name + ': ' + count + ' documents');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCollections();
