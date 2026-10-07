const router  = require('express').Router();
const auth    = require('../middleware/auth');
const { Invoice } = require('../models/Other');
const User    = require('../models/User');

// Get my invoices
router.get('/my', auth(['CUSTOMER']), async (req, res) => {
  try {
    const invoices = await Invoice.find({ customerId: req.user.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single invoice
router.get('/:id', auth(['CUSTOMER', 'ADMIN']), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.customerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(invoice);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
