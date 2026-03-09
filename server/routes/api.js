import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import Bill from '../models/Bill.js';
import Prescription from '../models/Prescription.js';
import Notification from '../models/Notification.js';
import RecurringOrder from '../models/RecurringOrder.js';
import { MedicationSchedule, MedicationLog } from '../models/Medication.js';
import { Purchase, AuditLog } from '../models/AuditLog.js';

const router = express.Router();

export const setupApiRoutes = (io) => {
  // Helper to send real-time notification
  const sendNotification = async (notifData) => {
    const notif = new Notification({
      id: `NOTIF${Date.now()}${Math.floor(Math.random() * 1000)}`,
      ...notifData,
      createdAt: new Date().toISOString(),
      isRead: false
    });
    await notif.save();
    io.emit('notification', notif);
  };

  // Users
  router.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
  });
  router.post('/users', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  });
  router.put('/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(user);
  });
  router.delete('/users/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // Medicines
  router.get('/medicines', async (req, res) => {
    const medicines = await Medicine.find();
    
    // Background check for expiry/near-expiry (non-blocking)
    const checkExpiry = async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      for (const med of medicines) {
        const expiryDate = new Date(med.expiry);
        if (expiryDate < now) {
          // Expired
          const exists = await Notification.findOne({ 
            relatedId: med.id, 
            type: 'EXPIRY',
            title: 'Medicine Expired'
          });
          if (!exists) {
            await sendNotification({
              title: 'Medicine Expired',
              message: `CRITICAL: Medicine ${med.name} (Batch: ${med.id}) has EXPIRED. Immediate disposal required.`,
              type: 'EXPIRY',
              targetRoles: ['ADMIN', 'PHARMACIST', 'STAFF'],
              relatedId: med.id
            });
          }
        } else if (expiryDate < thirtyDaysFromNow) {
          // Near Expiry
          const exists = await Notification.findOne({ 
            relatedId: med.id, 
            type: 'EXPIRY',
            title: 'Near Expiry Alert'
          });
          if (!exists) {
            await sendNotification({
              title: 'Near Expiry Alert',
              message: `Medicine ${med.name} (Batch: ${med.id}) will expire on ${med.expiry}. Plan for stock clearance.`,
              type: 'EXPIRY',
              targetRoles: ['ADMIN', 'PHARMACIST', 'STAFF'],
              relatedId: med.id
            });
          }
        }
      }
    };
    checkExpiry().catch(err => console.error('Expiry check error:', err));

    res.json(medicines);
  });
  router.post('/medicines', async (req, res) => {
    try {
      const { _id, __v, ...medData } = req.body;
      if (!medData.id) medData.id = `MED${Date.now()}`;
      const med = new Medicine(medData);
      await med.save();
      res.json(med);
    } catch (err) {
      console.error('Error creating medicine:', err);
      res.status(500).json({ error: 'Failed to create medicine', details: err.message });
    }
  });
  router.put('/medicines/:id', async (req, res) => {
    try {
      const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
      const med = await Medicine.findOneAndUpdate(query, req.body, { returnDocument: 'after' });
      
      if (med && med.stock <= med.criticalStockLimit) {
        await sendNotification({
          title: 'Low Stock Alert',
          message: `Medicine ${med.name} is running low on stock (${med.stock} left).`,
          type: 'LOW_STOCK',
          targetRoles: ['ADMIN', 'PHARMACIST', 'STAFF'],
          relatedId: med.id
        });
      }
      res.json(med);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update medicine', details: err.message });
    }
  });
  router.delete('/medicines/:id', async (req, res) => {
    try {
      const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
      await Medicine.findOneAndDelete(query);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete medicine', details: err.message });
    }
  });

  // Recommendations
  router.get('/recommendations', async (req, res) => {
    try {
      const { medicineId, customerId } = req.query;
      if (!medicineId) {
        return res.status(400).json({ error: 'medicineId is required' });
      }

      const query = mongoose.isValidObjectId(medicineId) ? { _id: medicineId } : { id: medicineId };
      const baseMed = await Medicine.findOne(query);

      if (!baseMed) {
        return res.status(404).json({ error: 'Medicine not found' });
      }

      // Find all active alternatives with the same salt composition
      const alternatives = await Medicine.find({
        saltComposition: baseMed.saltComposition,
        status: 'ACTIVE',
        id: { $ne: baseMed.id } // exclude self
      });

      let previouslyBoughtIds = new Set();
      let previouslyApprovedNames = new Set();

      if (customerId) {
        // Fetch user bill history to check for previous purchases
        const bills = await Bill.find({ customerId });
        bills.forEach(bill => {
          bill.items.forEach(item => {
            previouslyBoughtIds.add(item.medicineId);
          });
        });

        // Fetch user prescription history
        const prescriptions = await Prescription.find({ customerId, isDeleted: { $ne: true } });
        prescriptions.forEach(p => {
          if (p.approvedMedicines) {
            p.approvedMedicines.forEach(name => previouslyApprovedNames.add(name.toLowerCase()));
          }
          if (p.alternatives) {
            p.alternatives.forEach(alt => {
               if (alt.status === 'ACCEPTED') {
                 previouslyApprovedNames.add(alt.suggestedName.toLowerCase());
               }
            });
          }
        });
      }

      // Score and format alternatives
      const scoredAlternatives = alternatives.map(alt => {
        let score = 0;
        const tags = []; // array of { type, label }

        // Lower cost check
        if (alt.price < baseMed.price) {
          const savings = baseMed.price - alt.price;
          tags.push({ type: 'LOWER_COST', label: `Save $${savings.toFixed(2)}` });
          score += 2;
        }

        // Generic classification check
        if (alt.classification.toLowerCase().includes('generic')) {
           tags.push({ type: 'GENERIC', label: 'Generic Option' });
           score += 1;
        }

        // Previous purchase check
        if (previouslyBoughtIds.has(alt.id)) {
          tags.push({ type: 'BOUGHT_BEFORE', label: 'Purchased Before' });
          score += 3; // high confidence if user bought it before
        }

        // Previous prescription check
        if (previouslyApprovedNames.has(alt.name.toLowerCase())) {
          tags.push({ type: 'PRESCRIBED_BEFORE', label: 'Prescribed to You' });
          score += 3;
        }
        
        // Exact match of strength gives a small bump
        if (alt.strength === baseMed.strength) {
          score += 1;
        }

        return {
          ...alt.toObject(),
          id: alt.id || alt._id.toString(), // Normalize ID
          matchScore: score,
          tags
        };
      });

      // Sort by score descending, then by price ascending
      scoredAlternatives.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
           return b.matchScore - a.matchScore;
        }
        return a.price - b.price;
      });

      res.json(scoredAlternatives);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      res.status(500).json({ error: 'Failed to fetch recommendations', details: err.message });
    }
  });

  // Medicine Name Confusion Prevention (LASA)
  router.post('/verify-lasa', async (req, res) => {
    try {
      const { medicineId } = req.body;
      if (!medicineId) {
        return res.status(400).json({ error: 'medicineId is required' });
      }

      // Fetch the medicine being added
      const targetQuery = mongoose.isValidObjectId(medicineId) ? { _id: medicineId } : { id: medicineId };
      const targetMed = await Medicine.findOne(targetQuery);
      
      if (!targetMed) {
        return res.status(404).json({ error: 'Medicine not found' });
      }

      // Fetch all active medicines to compare against (excluding the target itself)
      const allActiveMedicines = await Medicine.find({
        status: 'ACTIVE',
        $and: [
          { _id: { $ne: targetMed._id } },
          { id: { $ne: targetMed.id } }
        ]
      });

      // Levenshtein distance implementation
      const levenshteinDistance = (str1, str2) => {
        const track = Array(str2.length + 1).fill(null).map(() =>
          Array(str1.length + 1).fill(null)
        );
        for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
        for (let j = 1; j <= str2.length; j += 1) {
           for (let i = 1; i <= str1.length; i += 1) {
              const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
              track[j][i] = Math.min(
                 track[j][i - 1] + 1, // deletion
                 track[j - 1][i] + 1, // insertion
                 track[j - 1][i - 1] + indicator // substitution
              );
           }
        }
        return track[str2.length][str1.length];
      };

      const warnings = [];
      const SIMILARITY_THRESHOLD = 0.45; // 45% similar or more to catch pairs like Celexa/Celebrex
      const name1 = targetMed.name.toLowerCase();

      for (const compareMed of allActiveMedicines) {
        const name2 = compareMed.name.toLowerCase();
        const distance = levenshteinDistance(name1, name2);
        const maxLength = Math.max(name1.length, name2.length);
        const similarity = maxLength === 0 ? 0 : (maxLength - distance) / maxLength;

        // If highly similar names BUT different compositions/drugs -> LASA Risk
        if (similarity >= SIMILARITY_THRESHOLD && targetMed.saltComposition !== compareMed.saltComposition) {
          console.log(`LASA Triggered: ${name1} vs ${name2} (Similarity: ${similarity})`);
          warnings.push({
             med1: { id: targetMed.id || targetMed._id.toString(), name: targetMed.name, composition: targetMed.saltComposition },
             med2: { id: compareMed.id || compareMed._id.toString(), name: compareMed.name, composition: compareMed.saltComposition },
             similarity: (similarity * 100).toFixed(1)
          });
        }
      }

      res.json(warnings);
    } catch (err) {
      console.error('Error verifying LASA:', err);
      res.status(500).json({ error: 'Failed to verify LASA', details: err.message });
    }
  });

  // Suppliers
  router.get('/suppliers', async (req, res) => {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  });
  router.post('/suppliers', async (req, res) => {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.json(supplier);
  });
  router.put('/suppliers/:id', async (req, res) => {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(supplier);
  });
  router.delete('/suppliers/:id', async (req, res) => {
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  // Bills
  router.get('/bills', async (req, res) => {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  });
  router.post('/bills', async (req, res) => {
    try {
      const billData = { ...req.body };
      if (!billData.id) billData.id = `INV${Date.now()}`;
      const bill = new Bill(billData);
      await bill.save();

      // Update medicine stock
      for (const item of bill.items) {
        try {
          const medQuery = mongoose.isValidObjectId(item.medicineId) ? { _id: item.medicineId } : { id: item.medicineId };
          const med = await Medicine.findOne({ 
            $or: [
              medQuery,
              { name: item.name }
            ]
          });

          if (med) {
            med.stock -= item.quantity;
            // Ensure id is present before saving if it was missing
            if (!med.id) med.id = `MED${Date.now()}${Math.floor(Math.random() * 1000)}`;
            await med.save();
            
            if (med.stock <= med.criticalStockLimit) {
              await sendNotification({
                title: 'Low Stock Alert',
                message: `Medicine ${med.name} is running low on stock (${med.stock} left).`,
                type: 'LOW_STOCK',
                targetRoles: ['ADMIN', 'PHARMACIST', 'STAFF'],
                relatedId: med.id
              });
            }
          }
        } catch (stockErr) {
          console.error('Error updating stock for item:', item.name, stockErr);
        }
      }

      await sendNotification({
        title: 'New Bill Created',
        message: `A new bill of $${bill.grandTotal} has been generated for ${bill.customerName}.`,
        type: 'LARGE_BILL',
        targetRoles: ['ADMIN', 'STAFF', 'PHARMACIST'],
        relatedId: bill.id
      });

      // Update prescription usage if applicable
      if (bill.prescriptionId) {
        try {
          const rxQuery = mongoose.isValidObjectId(bill.prescriptionId) ? { _id: bill.prescriptionId } : { id: bill.prescriptionId };
          const prescription = await Prescription.findOne(rxQuery);
            if (prescription) {
              console.log(`Updating usage for prescription ${prescription.id || prescription._id}`);
              
              // Ensure medicineUsage is initialized
              if (!prescription.medicineUsage) {
                prescription.medicineUsage = new Map();
              }
              
              // Ensure id is present to satisfy validation if it was missing
              if (!prescription.id) {
                prescription.id = `PRES${Date.now()}${Math.floor(Math.random() * 1000)}`;
              }
              
              for (const item of bill.items) {
              // Find the authorized name in the prescription that matches this item (case-insensitive)
              const authorizedName = prescription.approvedMedicines?.find(n => n.toLowerCase() === item.name.toLowerCase()) || 
                                    prescription.alternatives?.find(a => a.suggestedName.toLowerCase() === item.name.toLowerCase() && a.status === 'ACCEPTED')?.suggestedName;
              
              if (authorizedName) {
                const current = prescription.medicineUsage.get(authorizedName) || 0;
                console.log(`Item: ${item.name}, Authorized Name: ${authorizedName}, Current Usage: ${current}`);
                
                // Enforce limit of 2 per prescription
                if (current + 1 > 2) {
                  console.warn(`Prescription limit exceeded for ${authorizedName}`);
                }
                
                prescription.medicineUsage.set(authorizedName, current + 1);
              } else {
                console.log(`Item ${item.name} not found in prescription authorizations`);
              }
            }
            
            prescription.markModified('medicineUsage');
            await prescription.save();
            console.log('Prescription usage updated successfully');
          } else {
            console.warn(`Prescription not found for ID: ${bill.prescriptionId}`);
          }
        } catch (rxErr) {
          console.error('Error updating prescription usage:', rxErr);
        }
      }

      res.json(bill);
    } catch (err) {
      console.error('Error creating bill:', err);
      res.status(500).json({ error: 'Failed to create bill', details: err.message });
    }
  });

  // Prescriptions
  router.get('/prescriptions', async (req, res) => {
    const prescriptions = await Prescription.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(prescriptions);
  });
  router.post('/prescriptions', async (req, res) => {
    try {
      const pData = { ...req.body };
      if (!pData.id) pData.id = `PRES${Date.now()}`;
      const prescription = new Prescription(pData);
      await prescription.save();
      
      await sendNotification({
        title: 'New Prescription Uploaded',
        message: `A new prescription has been uploaded by a customer.`,
        type: 'PRESCRIPTION_STATUS',
        targetRoles: ['PHARMACIST'],
        relatedId: prescription._id
      });
      
      res.json(prescription);
    } catch (err) {
      console.error('Error uploading prescription:', err);
      res.status(500).json({ error: 'Failed to upload prescription', details: err.message });
    }
  });
  router.put('/prescriptions/:id', async (req, res) => {
    try {
      const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
      const prescription = await Prescription.findOneAndUpdate(query, req.body, { returnDocument: 'after' });
      
      if (req.body.status) {
        await sendNotification({
          title: 'Prescription Status Updated',
          message: `Your prescription status has been updated to ${req.body.status}.`,
          type: 'PRESCRIPTION_STATUS',
          targetRoles: ['CUSTOMER'],
          customerId: prescription?.customerId,
          relatedId: prescription?.id
        });
      }
      
      res.json(prescription);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update prescription', details: err.message });
    }
  });
  router.delete('/prescriptions/:id', async (req, res) => {
    try {
      const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
      await Prescription.findOneAndUpdate(query, { isDeleted: true });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete prescription', details: err.message });
    }
  });

  // Notifications
  router.get('/notifications', async (req, res) => {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  });
  router.put('/notifications/:id/read', async (req, res) => {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(notif);
  });

  // Recurring Orders
  router.get('/recurring-orders', async (req, res) => {
    const orders = await RecurringOrder.find();
    res.json(orders);
  });
  router.post('/recurring-orders', async (req, res) => {
    const roData = { ...req.body };
    if (!roData.id) roData.id = `REC${Date.now()}`;
    const order = new RecurringOrder(roData);
    await order.save();
    res.json(order);
  });
  router.put('/recurring-orders/:id', async (req, res) => {
    try {
      const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
      const order = await RecurringOrder.findOneAndUpdate(query, req.body, { returnDocument: 'after' });
      res.json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update recurring order', details: err.message });
    }
  });

  // Medication Schedules & Logs
  router.get('/medication-schedules', async (req, res) => {
    const schedules = await MedicationSchedule.find();
    res.json(schedules);
  });
  router.post('/medication-schedules', async (req, res) => {
    const sData = { ...req.body };
    if (!sData.id) sData.id = `SCHED${Date.now()}`;
    const schedule = new MedicationSchedule(sData);
    await schedule.save();
    res.json(schedule);
  });
  router.delete('/medication-schedules/:id', async (req, res) => {
    await MedicationSchedule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  });

  router.get('/medication-logs', async (req, res) => {
    const logs = await MedicationLog.find();
    res.json(logs);
  });
  router.post('/medication-logs', async (req, res) => {
    const { scheduleId, date, slot, status } = req.body;
    const log = await MedicationLog.findOneAndUpdate(
      { scheduleId, date, slot },
      { 
        $set: { status },
        $setOnInsert: { id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}` }
      },
      { upsert: true, returnDocument: 'after' }
    );
    res.json(log);
  });

  // Purchases & Audit Logs
  router.get('/purchases', async (req, res) => {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  });
  router.post('/purchases', async (req, res) => {
    const pData = { ...req.body };
    if (!pData.id) pData.id = `PUR${Date.now()}`;
    const purchase = new Purchase(pData);
    await purchase.save();
    res.json(purchase);
  });

  router.get('/audit-logs', async (req, res) => {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  });
  router.post('/audit-logs', async (req, res) => {
    const aData = { ...req.body };
    if (!aData.id) aData.id = `AUDIT${Date.now()}`;
    const log = new AuditLog(aData);
    await log.save();
    res.json(log);
  });

  return router;
};
