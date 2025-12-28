require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        seedAdmin();
    })
    .catch((err) => console.error('MongoDB connection error:', err));

// Incident Schema
const incidentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, default: 'Untitled Incident' },
    type: { type: String, default: 'ACCIDENT' },
    severity: { type: String, default: 'LOW' },
    status: { type: String, default: 'UNVERIFIED' },
    description: { type: String, default: 'No description provided.' },
    location: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        address: { type: String, default: 'Unknown Address' },
        area: { type: String, default: 'Unknown Area' },
    },
    reporterId: { type: String, default: 'system' },
    reporterAnonymous: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: String,
    assignedDepartment: String,
    assignedResponder: String,
    duplicateOf: String,
    media: { type: [String], default: [] },
    priority: { type: Number, default: 0 },
});

const Incident = mongoose.model('Incident', incidentSchema);

// Activity Log Schema (Simple for now, could be expanded)
const activityLogSchema = new mongoose.Schema({
    id: String,
    incidentId: String,
    action: String,
    details: String,
    userId: String,
    userName: String,
    timestamp: { type: Date, default: Date.now },
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    id: String,
    type: String,
    title: String,
    message: String,
    incidentId: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);

// User Schema
const userSchema = new mongoose.Schema({
    id: String,
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'RESPONDER' }, // ADMIN, RESPONDER, CITIZEN
    department: String,
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Seed Admin Helper
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@sentinel.com' });
        if (!adminExists) {
            console.log("Seeding admin user...");
            await new User({
                id: 'admin-001',
                name: 'Admin User',
                email: 'admin@sentinel.com',
                password: 'admin123',
                role: 'ADMIN',
                department: 'HQ'
            }).save();
            console.log("Admin user seeded.");
        }

        const responderExists = await User.findOne({ email: 'responder@sentinel.com' });
        if (!responderExists) {
            console.log("Seeding responder user...");
            await new User({
                id: 'resp-001',
                name: 'John Responder',
                email: 'responder@sentinel.com',
                password: 'resp123',
                role: 'RESPONDER',
                department: 'POLICE'
            }).save();
            console.log("Responder user seeded.");
        }

        const fireExists = await User.findOne({ email: 'fire@sentinel.com' });
        if (!fireExists) {
            await new User({
                id: 'fire-001', name: 'Fire Chief', email: 'fire@sentinel.com',
                password: 'fire123', role: 'RESPONDER', department: 'FIRE_DEPARTMENT'
            }).save();
            console.log("Fire admin seeded.");
        }

        const medicExists = await User.findOne({ email: 'medic@sentinel.com' });
        if (!medicExists) {
            await new User({
                id: 'medic-001', name: 'Medical Coordinator', email: 'medic@sentinel.com',
                password: 'medic123', role: 'RESPONDER', department: 'AMBULANCE'
            }).save();
            console.log("Medical admin seeded.");
        }

        const infraExists = await User.findOne({ email: 'infra@sentinel.com' });
        if (!infraExists) {
            await new User({
                id: 'infra-001', name: 'Infra Supervisor', email: 'infra@sentinel.com',
                password: 'infra123', role: 'RESPONDER', department: 'INFRASTRUCTURE'
            }).save();
            console.log("Infra admin seeded.");
        }
    } catch (e) {
        console.error("Seeding error:", e);
    }
};




// Helper to add log
const addLog = async (incidentId, action, details) => {
    try {
        const newLog = new ActivityLog({
            id: `log-${Date.now()}`,
            incidentId,
            action,
            details,
            userId: 'admin-001',
            userName: 'John Commander',
            timestamp: new Date(),
        });
        await newLog.save();
    } catch (e) {
        console.error("Failed to save log", e);
    }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password }); // Plain text check for now

        if (user) {
            res.json({
                token: `mock-jwt-token-${user.id}`,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper to add log

// Routes

// Get all incidents
app.get('/api/incidents', async (req, res) => {
    try {
        const rawIncidents = await Incident.find().lean().sort({ createdAt: -1 }).limit(100);
        const incidents = rawIncidents.map(i => ({
            ...i,
            id: i.incidentId || i.id || i._id.toString(), // Prefer incidentId
            priority: i.predictivePriority || i.priority || 0, // Prefer predictivePriority
            severity: i.severity ? i.severity.toUpperCase() : 'LOW',
            type: i.type ? i.type.toUpperCase() : 'ACCIDENT',
            status: i.status ? i.status.toUpperCase() : 'UNVERIFIED',
            media: Array.isArray(i.media) ? i.media : [],
            location: {
                lat: i.location?.lat || i.latitude || 0,
                lng: i.location?.lng || i.longitude || 0,
                address: i.location?.address || i.address || 'Unknown Address',
                area: i.location?.area || i.area || 'Unknown Area',
            }
        }));
        res.json(incidents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single incident
app.get('/api/incidents/:id', async (req, res) => {
    try {
        // Try finding by custom ID first, then _id
        let incident = await Incident.findOne({ id: req.params.id }).lean();
        if (!incident) {
            try {
                incident = await Incident.findById(req.params.id).lean();
            } catch (e) { }
        }

        if (incident) {
            const formatted = {
                ...incident,
                id: incident.id || incident._id.toString(),
                severity: incident.severity ? incident.severity.toUpperCase() : 'LOW',
                type: incident.type ? incident.type.toUpperCase() : 'ACCIDENT',
                status: incident.status ? incident.status.toUpperCase() : 'UNVERIFIED',
                media: Array.isArray(incident.media) ? incident.media : [],
                location: {
                    lat: incident.location?.lat || incident.latitude || 0,
                    lng: incident.location?.lng || incident.longitude || 0,
                    address: incident.location?.address || incident.address || 'Unknown Address',
                    area: incident.location?.area || incident.area || 'Unknown Area',
                }
            };
            res.json(formatted);
        }
        else res.status(404).send('Not found');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Incident
app.post('/api/incidents', async (req, res) => {
    try {
        const data = req.body;
        const newIncident = new Incident({
            ...data,
            id: data.id || `INC-${Date.now()}`, // Fallback ID generation
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await newIncident.save();
        await addLog(newIncident.id, 'INCIDENT_CREATED', `New incident reported: ${newIncident.title}`);
        res.status(201).json(newIncident);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Status
app.patch('/api/incidents/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            { $set: { status, updatedAt: new Date() } },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'STATUS_CHANGED', `Status changed to ${status}`);
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Severity
app.patch('/api/incidents/:id/severity', async (req, res) => {
    const { severity } = req.body;
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            { $set: { severity, updatedAt: new Date() } },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'SEVERITY_CHANGED', `Severity updated to ${severity}`);
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Department
app.patch('/api/incidents/:id/department', async (req, res) => {
    const { department } = req.body;
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            { $set: { assignedDepartment: department, updatedAt: new Date() } },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'DEPARTMENT_CHANGED', `Assigned to ${department}`);
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Verify
app.post('/api/incidents/:id/verify', async (req, res) => {
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            {
                $set: {
                    status: 'VERIFIED',
                    verified: true, // Explicitly set verified field
                    verifiedAt: new Date(),
                    verifiedBy: 'admin-001',
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'VERIFIED', 'Incident verified by admin');
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark False
app.post('/api/incidents/:id/false', async (req, res) => {
    const { reason } = req.body;
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            { $set: { status: 'FALSE', updatedAt: new Date() } },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'MARKED_FALSE', `Marked as false report: ${reason}`);
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark Duplicate
app.post('/api/incidents/:id/duplicate', async (req, res) => {
    const { originalId } = req.body;
    try {
        const incident = await Incident.findOneAndUpdate(
            { $or: [{ id: req.params.id }, { incidentId: req.params.id }] },
            {
                $set: {
                    status: 'DUPLICATE',
                    duplicateOf: originalId,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        if (incident) {
            await addLog(incident.id, 'MARKED_DUPLICATE', `Marked as duplicate of ${originalId}`);
            res.json(incident);
        } else {
            res.status(404).send('Not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Note Schema
const noteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    incidentId: { type: String, required: true },
    content: String,
    authorId: { type: String, default: 'admin-001' },
    authorName: { type: String, default: 'System Admin' },
    createdAt: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', noteSchema);

// ... (other routes)

// Get Notes
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Note
app.post('/api/incidents/:id/notes', async (req, res) => {
    const { content } = req.body;
    try {
        const newNote = new Note({
            id: `note-${Date.now()}`,
            incidentId: req.params.id,
            content,
            authorId: 'admin-001',
            authorName: 'System Admin'
        });
        await newNote.save();
        await addLog(req.params.id, 'NOTE_ADDED', 'Admin note added');
        res.status(201).json(newNote);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const [totalActive, unverified, verifiedInProgress, resolvedToday] = await Promise.all([
            Incident.countDocuments({ status: { $nin: ['RESOLVED', 'FALSE', 'DUPLICATE', 'Resolved', 'False', 'Duplicate'] } }),
            Incident.countDocuments({ status: { $in: ['UNVERIFIED', 'Unverified'] } }),
            Incident.countDocuments({ status: { $in: ['VERIFIED', 'IN_PROGRESS', 'ASSIGNED', 'Verified', 'In_Progress', 'Assigned'] } }),
            Incident.countDocuments({ status: { $in: ['RESOLVED', 'Resolved'] } }) // Simplified for 'Today' logic to just total resolved for now or add date filter if strictly needed
        ]);

        res.json({
            totalActive,
            unverified,
            verifiedInProgress,
            resolvedToday
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/activity-logs', async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const notes = await Notification.find().sort({ createdAt: -1 }).limit(50);
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notifications/:id/read', async (req, res) => {
    try {
        const note = await Notification.findOneAndUpdate(
            { id: req.params.id },
            { $set: { read: true } },
            { new: true }
        );
        res.json(note);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Sentinel Backend running on http://localhost:${PORT}`);
});
