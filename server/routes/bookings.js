const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Booking = require('../models/Booking');
const { TimeSlot } = require('../models/Other');

// Create booking
router.post('/', auth(['CUSTOMER']), async (req, res) => {
  try {
    const { vehicleMake, vehicleModel, vehicleNumber, vehicleYear, serviceType, slotId, scheduledDate, notes } = req.body;
    let slotTime = null;
    if (slotId) {
      const slot = await TimeSlot.findById(slotId);
      if (!slot) return res.status(404).json({ message: 'Slot not found' });
      if (slot.booked >= slot.capacity) return res.status(400).json({ message: 'Slot is fully booked' });
      slot.booked += 1;
      await slot.save();
      slotTime = slot.startTime + ' - ' + slot.endTime;
    }
    const booking = await Booking.create({
      customerId:   req.user.id,
      customerName: req.user.firstName || 'Customer',
      slotId, slotTime, vehicleMake, vehicleModel,
      vehicleNumber, vehicleYear, serviceType, scheduledDate, notes
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get booking by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my bookings
router.get('/my/list', auth(['CUSTOMER']), async (req, res) => {
  try {
    const { status, limit } = req.query;
    let query = { customerId: req.user.id };
    if (status) query.status = status;
    let bookings = await Booking.find(query).sort({ createdAt: -1 });
    if (limit) bookings = bookings.slice(0, parseInt(limit));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my stats
router.get('/my/stats', auth(['CUSTOMER']), async (req, res) => {
  try {
    const id = req.user.id;
    const total     = await Booking.countDocuments({ customerId: id });
    const active    = await Booking.countDocuments({ customerId: id, status: { $in: ['CONFIRMED','IN_PROGRESS'] } });
    const completed = await Booking.countDocuments({ customerId: id, status: 'COMPLETED' });
    const completedBookings = await Booking.find({ customerId: id, status: 'COMPLETED' });
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    res.json({ total, active, completed, totalSpent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel booking
router.put('/:id/cancel', auth(['CUSTOMER']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.customerId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    if (booking.status !== 'PENDING') return res.status(400).json({ message: 'Only pending bookings can be cancelled' });
    booking.status = 'CANCELLED';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
