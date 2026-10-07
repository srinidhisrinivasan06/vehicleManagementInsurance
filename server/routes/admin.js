const router   = require('express').Router();
const auth     = require('../middleware/auth');
const Booking  = require('../models/Booking');
const User     = require('../models/User');
const { TimeSlot } = require('../models/Other');

// Stats
router.get('/stats', auth(['ADMIN']), async (req, res) => {
  try {
    const completed = await Booking.find({ status: 'COMPLETED' });
    const totalRevenue = completed.reduce((s, b) => s + (b.amount || 0), 0);
    res.json({
      totalBookings:     await Booking.countDocuments(),
      pendingBookings:   await Booking.countDocuments({ status: 'PENDING' }),
      completedBookings: await Booking.countDocuments({ status: 'COMPLETED' }),
      totalUsers:        await User.countDocuments(),
      totalProviders:    await User.countDocuments({ role: 'PROVIDER' }),
      totalRevenue
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all bookings
router.get('/bookings', auth(['ADMIN']), async (req, res) => {
  try {
    const { status, search, limit } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { customerName: { $regex: search, $options: 'i' } },
      { vehicleModel: { $regex: search, $options: 'i' } },
      { vehicleNumber: { $regex: search, $options: 'i' } }
    ];
    let bookings = await Booking.find(query).sort({ createdAt: -1 });
    if (limit) bookings = bookings.slice(0, parseInt(limit));
    res.json(bookings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update booking
router.put('/bookings/:id', auth(['ADMIN']), async (req, res) => {
  try {
    const { status, providerId, notes, finalAmount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (status) booking.status = status;
    if (notes)  booking.notes  = notes;
    if (finalAmount) booking.amount = finalAmount;
    if (providerId) {
      const provider = await User.findById(providerId);
      if (provider) {
        booking.providerId   = provider._id;
        booking.providerName = provider.firstName + ' ' + provider.lastName;
      }
    }
    await booking.save();
    res.json(booking);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get providers
router.get('/providers', auth(['ADMIN']), async (req, res) => {
  try {
    const providers = await User.find({ role: 'PROVIDER' }).select('-password');
    res.json(providers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get users
router.get('/users', auth(['ADMIN']), async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Toggle user active
router.put('/users/:id/toggle', auth(['ADMIN']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.active = !user.active;
    await user.save();
    res.json({ message: 'User status updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create slot
router.post('/slots', auth(['ADMIN']), async (req, res) => {
  try {
    const slot = await TimeSlot.create(req.body);
    res.json(slot);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get slots by date
router.get('/slots', auth(['ADMIN']), async (req, res) => {
  try {
    const date = new Date(req.query.date);
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const slots = await TimeSlot.find({ date: { $gte: date, $lt: next } });
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete slot
router.delete('/slots/:id', auth(['ADMIN']), async (req, res) => {
  try {
    await TimeSlot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
