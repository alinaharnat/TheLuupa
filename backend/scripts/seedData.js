import mongoose from "mongoose";
import dotenv from "dotenv";
import City from "../models/city.js";
import Country from "../models/country.js";
import Route from "../models/route.js";
import Bus from "../models/bus.js";
import Schedule from "../models/schedule.js";
import Seat from "../models/seat.js";
import User from "../models/user.js";
import { generateUserId } from "../utils/generateId.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    await City.deleteMany({});
    await Country.deleteMany({});
    await Route.deleteMany({});
    await Bus.deleteMany({});
    await Schedule.deleteMany({});
    await Seat.deleteMany({});
    console.log("Existing data cleared");

    const ukraine = await Country.create({
      name: "Ukraine",
    });
    console.log("Country created");

    const kyiv = await City.create({ name: "Kyiv", countryId: ukraine._id });
    const lviv = await City.create({ name: "Lviv", countryId: ukraine._id });
    const odesa = await City.create({ name: "Odesa", countryId: ukraine._id });
    const kharkiv = await City.create({ name: "Kharkiv", countryId: ukraine._id });
    const dnipro = await City.create({ name: "Dnipro", countryId: ukraine._id });
    console.log("Cities created");

    let carrier = await User.findOne({ email: "carrier@test.com" });
    if (!carrier) {
      const userId = await generateUserId();
      carrier = await User.create({
        email: "carrier@test.com",
        userId,
        name: "Test Carrier",
        surname: "Company",
        dateOfBirth: new Date("1990-01-01"),
        role: "carrier",
        isEmailVerified: true,
      });
    }
    console.log("Carrier user created/found");

    const route1 = await Route.create({
      userId: carrier._id,
      cityId: [kyiv._id, lviv._id],
      distance: 540,
    });

    const route2 = await Route.create({
      userId: carrier._id,
      cityId: [kyiv._id, odesa._id],
      distance: 475,
    });

    const route3 = await Route.create({
      userId: carrier._id,
      cityId: [kyiv._id, kharkiv._id],
      distance: 480,
    });

    const route4 = await Route.create({
      userId: carrier._id,
      cityId: [lviv._id, odesa._id],
      distance: 790,
    });

    const route5 = await Route.create({
      userId: carrier._id,
      cityId: [kyiv._id, dnipro._id, kharkiv._id],
      distance: 630,
    });
    console.log("Routes created");

    const bus1 = await Bus.create({
      userId: carrier._id,
      routeId: route1._id,
      numberPlate: "AA 1234 BB",
    });

    const bus2 = await Bus.create({
      userId: carrier._id,
      routeId: route2._id,
      numberPlate: "AA 5678 BB",
    });

    const bus3 = await Bus.create({
      userId: carrier._id,
      routeId: route3._id,
      numberPlate: "AA 9012 BB",
    });

    const bus4 = await Bus.create({
      userId: carrier._id,
      routeId: route4._id,
      numberPlate: "AA 3456 BB",
    });

    const bus5 = await Bus.create({
      userId: carrier._id,
      routeId: route5._id,
      numberPlate: "AA 7890 BB",
    });
    console.log("Buses created");

    const buses = [bus1, bus2, bus3, bus4, bus5];
    for (const bus of buses) {
      const seats = [];
      for (let i = 1; i <= 40; i++) {
        seats.push({
          busId: bus._id,
          seatNumber: i,
          isAvailable: true,
        });
      }
      await Seat.insertMany(seats);
    }
    console.log("Seats created for all buses");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const schedules = [
      {
        busId: bus1._id,
        departureTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        arrivalTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        price: 25,
      },
      {
        busId: bus1._id,
        departureTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        arrivalTime: new Date(today.getTime() + 21 * 60 * 60 * 1000),
        price: 25,
      },
      {
        busId: bus1._id,
        departureTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        arrivalTime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000),
        price: 25,
      },
      {
        busId: bus2._id,
        departureTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        arrivalTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        price: 30,
      },
      {
        busId: bus3._id,
        departureTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        arrivalTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        price: 22,
      },
      {
        busId: bus4._id,
        departureTime: new Date(tomorrow.getTime() + 7 * 60 * 60 * 1000),
        arrivalTime: new Date(tomorrow.getTime() + 18 * 60 * 60 * 1000),
        price: 35,
      },
      {
        busId: bus5._id,
        departureTime: new Date(today.getTime() + 6 * 60 * 60 * 1000),
        arrivalTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        price: 28,
      },
    ];

    await Schedule.insertMany(schedules);
    console.log("Schedules created");

    console.log("\n✅ Seed data created successfully!");
    console.log("\nTest data:");
    console.log("- Cities: Kyiv, Lviv, Odesa, Kharkiv, Dnipro");
    console.log("- Routes: 5 routes");
    console.log("- Buses: 5 buses (40 seats each)");
    console.log("- Schedules: Multiple trips for today and tomorrow");
    console.log("\nCarrier credentials:");
    console.log("Email: carrier@test.com");
    console.log("Role: carrier");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
