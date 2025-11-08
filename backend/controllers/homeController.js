//controllers/homeController.js
import Booking from '../models/booking.js';
import Schedule from '../models/schedule.js';
import Bus from '../models/bus.js';
import Route from '../models/route.js';
import User from '../models/user.js';
import City from '../models/city.js';

/**
 * @desc    Get popular routes based on number of bookings
 * @route   GET /api/home/popular-routes
 * @access  Public
 */
const getPopularRoutes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate bookings to get routes with booking counts
    const popularRoutes = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'confirmed'] }
        }
      },
      {
        $lookup: {
          from: 'schedules',
          localField: 'scheduleId',
          foreignField: '_id',
          as: 'schedule'
        }
      },
      {
        $unwind: '$schedule'
      },
      {
        $lookup: {
          from: 'buses',
          localField: 'schedule.busId',
          foreignField: '_id',
          as: 'bus'
        }
      },
      {
        $unwind: '$bus'
      },
      {
        $group: {
          _id: '$bus.routeId',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Get route details with populated cities
    const routeIds = popularRoutes.map(item => item._id);
    const routes = await Route.find({ _id: { $in: routeIds } })
      .populate('cityId', 'name')
      .populate('userId', 'name');

    // Combine booking counts with route details
    const routesWithCounts = routes.map(route => {
      const routeData = popularRoutes.find(item => item._id.toString() === route._id.toString());
      return {
        routeId: route._id,
        from: route.cityId[0]?.name || '',
        to: route.cityId[route.cityId.length - 1]?.name || '',
        cities: route.cityId.map(city => city.name),
        distance: route.distance,
        carrier: route.userId?.name || '',
        bookingCount: routeData?.bookingCount || 0
      };
    });

    // Sort by booking count (in case population changed order)
    routesWithCounts.sort((a, b) => b.bookingCount - a.bookingCount);

    res.json({
      routes: routesWithCounts
    });
  } catch (error) {
    console.error('Get popular routes error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Get top carriers based on number of routes owned
 * @route   GET /api/home/top-carriers
 * @access  Public
 */
const getTopCarriers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate routes to count routes per carrier
    const carriersWithRouteCounts = await Route.aggregate([
      {
        $group: {
          _id: '$userId',
          routeCount: { $sum: 1 }
        }
      },
      {
        $sort: { routeCount: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Get carrier details
    const carrierIds = carriersWithRouteCounts.map(item => item._id);
    const carriers = await User.find({ _id: { $in: carrierIds }, role: 'carrier' })
      .select('name email');

    // Combine route counts with carrier details
    const carriersWithCounts = carriers.map(carrier => {
      const carrierData = carriersWithRouteCounts.find(
        item => item._id.toString() === carrier._id.toString()
      );
      return {
        carrierId: carrier._id,
        name: carrier.name,
        email: carrier.email,
        routeCount: carrierData?.routeCount || 0
      };
    });

    // Sort by route count (in case population changed order)
    carriersWithCounts.sort((a, b) => b.routeCount - a.routeCount);

    res.json({
      carriers: carriersWithCounts
    });
  } catch (error) {
    console.error('Get top carriers error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export { getPopularRoutes, getTopCarriers };

