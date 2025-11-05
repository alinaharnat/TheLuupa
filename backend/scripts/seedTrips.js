import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Country from '../models/country.js';
import City from '../models/city.js';
import Route from '../models/route.js';
import Bus from '../models/bus.js';
import Schedule from '../models/schedule.js';
import Seat from '../models/seat.js';
import connectDB from '../config/connectDB.js';

dotenv.config();

// Подключаемся к базе данных
await connectDB();

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  await Schedule.deleteMany({});
  await Seat.deleteMany({});
  await Bus.deleteMany({});
  await Route.deleteMany({});
  await City.deleteMany({});
  await Country.deleteMany({});
  // Delete only test carriers
  await User.deleteMany({ email: 'carrier@test.com' });
  console.log('✅ Database cleared');
}

async function seedData() {
  try {
    await clearDatabase();

    console.log('🚀 Starting database seeding...');

    // 1. Create test carrier
    console.log('👤 Creating test carrier...');
    const carrier = await User.create({
      userId: 100000,
      email: 'carrier@test.com',
      name: 'Test Carrier Company',
      role: 'carrier',
      isEmailVerified: true
    });
    console.log(`✅ Carrier created: ${carrier.name}`);

    // 2. Create country
    console.log('🌍 Creating country...');
    const ukraine = await Country.create({
      name: 'Ukraine'
    });
    console.log(`✅ Country created: ${ukraine.name}`);

    // 3. Create cities
    console.log('🏙️  Creating cities...');
    const cities = await City.create([
      { name: 'Kyiv', countryId: ukraine._id },
      { name: 'Lviv', countryId: ukraine._id },
      { name: 'Odesa', countryId: ukraine._id },
      { name: 'Kharkiv', countryId: ukraine._id },
      { name: 'Dnipro', countryId: ukraine._id },
      { name: 'Zaporizhzhia', countryId: ukraine._id },
      { name: 'Vinnytsia', countryId: ukraine._id },
      { name: 'Ternopil', countryId: ukraine._id }
    ]);
    console.log(`✅ Created ${cities.length} cities`);

    const [kyiv, lviv, odesa, kharkiv, dnipro, zaporizhzhia, vinnytsia, ternopil] = cities;

    // 4. Create routes
    console.log('🗺️  Creating routes...');
    const routes = await Route.create([
      { userId: carrier._id, cityId: [kyiv._id, lviv._id], distance: 540 },
      { userId: carrier._id, cityId: [kyiv._id, odesa._id], distance: 475 },
      { userId: carrier._id, cityId: [kyiv._id, kharkiv._id], distance: 480 },
      { userId: carrier._id, cityId: [kyiv._id, dnipro._id], distance: 480 },
      { userId: carrier._id, cityId: [lviv._id, odesa._id], distance: 790 },
      { userId: carrier._id, cityId: [lviv._id, ternopil._id], distance: 130 },
      { userId: carrier._id, cityId: [kyiv._id, vinnytsia._id], distance: 270 },
      { userId: carrier._id, cityId: [dnipro._id, zaporizhzhia._id], distance: 85 }
    ]);
    console.log(`✅ Created ${routes.length} routes`);

    // 5. Create buses
    console.log('🚌 Creating buses...');
    const buses = [];
    for (let i = 0; i < routes.length; i++) {
      const bus = await Bus.create({
        userId: carrier._id,
        routeId: routes[i]._id,
        numberPlate: `AA ${1000 + i} BB`,
        seats: [] // Оставляем пустым, места создадим отдельно
      });
      buses.push(bus);
    }
    console.log(`✅ Created ${buses.length} buses`);

    // 6. Create seats for each bus
    console.log('💺 Creating seats in buses...');
    let totalSeats = 0;
    for (const bus of buses) {
      const seats = [];
      for (let j = 1; j <= 40; j++) {
        seats.push({
          busId: bus._id,
          seatNumber: j,
          isAvailable: true
        });
      }
      await Seat.create(seats);
      totalSeats += seats.length;
    }
    console.log(`✅ Created ${totalSeats} seats`);

    // 7. Create schedule for next 7 days
    console.log('📅 Creating schedule...');
    const schedules = [];

    // Get today's date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Create schedule for 7 days for each bus
    for (const bus of buses) {
      const route = routes.find(r => r._id.equals(bus.routeId));

      for (let day = 0; day < 7; day++) {
        // Morning trip (08:00)
        const morningDeparture = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + day,
          8, 0, 0, 0
        );

        const travelHours = Math.floor(route.distance / 80); // ~80 km/h average speed
        const morningArrival = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + day,
          8 + travelHours, 0, 0, 0
        );

        schedules.push({
          busId: bus._id,
          departureTime: morningDeparture,
          arrivalTime: morningArrival,
          price: Math.floor(route.distance * 0.13) // 0.13 currency per km (affordable pricing, max ~$100)
        });

        // Evening trip (18:00)
        const eveningDeparture = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + day,
          18, 0, 0, 0
        );

        const eveningArrival = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + day,
          18 + travelHours, 0, 0, 0
        );

        schedules.push({
          busId: bus._id,
          departureTime: eveningDeparture,
          arrivalTime: eveningArrival,
          price: Math.floor(route.distance * 0.13) // 0.13 currency per km (affordable pricing, max ~$100)
        });
      }
    }

    await Schedule.create(schedules);
    console.log(`✅ Created ${schedules.length} trips`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Statistics:');
    console.log(`   - Carriers: 1`);
    console.log(`   - Countries: 1`);
    console.log(`   - Cities: ${cities.length}`);
    console.log(`   - Routes: ${routes.length}`);
    console.log(`   - Buses: ${buses.length}`);
    console.log(`   - Trips: ${schedules.length}`);
    console.log(`   - Total seats: ${totalSeats}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

seedData();
