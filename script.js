// ═══════════════════════════════════════════════════════════════
        //  DATA LAYER
        //  Talks to a real Node.js + SQLite backend (see /server) instead
        //  of localStorage. The whole dataset is kept in an in-memory cache
        //  (`_cache`) so every existing loadData()/saveData() call site in
        //  this file keeps working exactly as before, synchronously —
        //  saveData() just also pushes the change to the database in the
        //  background.
        // ═══════════════════════════════════════════════════════════════

        const API_BASE = '/api';

        let _cache = null;        // in-memory mirror of the database
        let _dbReady = false;     // true once the initial fetch from the server has completed
        let _saveQueue = Promise.resolve(); // serializes saves so they hit the DB in order

        function persistData(data) {
            // Chain onto the queue so rapid-fire saves (e.g. two handlers firing back
            // to back) don't race each other and overwrite one another out of order.
            _saveQueue = _saveQueue
                .then(() => fetch(`${API_BASE}/data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }))
                .then(res => {
                    if (!res.ok) throw new Error('Server responded with ' + res.status);
                })
                .catch(err => {
                    console.error('Failed to save to database:', err);
                    showToast('⚠️ Could not save to the database. Check that the server is running.', 'error');
                });
            return _saveQueue;
        }

        async function fetchDataFromServer() {
            const res = await fetch(`${API_BASE}/data`);
            if (!res.ok) throw new Error('Server responded with ' + res.status);
            return res.json();
        }

        function getDefaultData() {
            return {
                users: [
                    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin Gomez',
                        email: 'admin@barangaygomez.ph', phone: '09123456789', address: 'Barangay Hall, Gomez',
                        birthdate: '1980-01-01', status: 'Active', createdAt: '2026-01-01' },
                    { id: 2, username: 'staff1', password: 'staff123', role: 'staff', name: 'Maria Santos',
                        email: 'maria@barangaygomez.ph', phone: '09234567890', address: 'Barangay Hall, Gomez',
                        birthdate: '1990-05-15', status: 'Active', createdAt: '2026-01-15' },
                    { id: 3, username: 'staff2', password: 'staff123', role: 'staff', name: 'Pedro Ramos',
                        email: 'pedro@barangaygomez.ph', phone: '09345678901', address: 'Barangay Hall, Gomez',
                        birthdate: '1985-11-02', status: 'Active', createdAt: '2026-01-15' },
                ],
                residents: [
                    { id: 1, name: 'Juan Dela Cruz', email: 'juan@email.com', phone: '09123456789', address: 'Purok 1, Barangay Gomez', birthdate: '1990-05-15', status: 'Active', registeredAt: '2026-01-10' },
                    { id: 2, name: 'Maria Reyes', email: 'maria.reyes@email.com', phone: '09234567890', address: 'Purok 2, Barangay Gomez', birthdate: '1988-09-22', status: 'Active', registeredAt: '2026-01-12' },
                    { id: 3, name: 'Pedro Santos', email: 'pedro.santos@email.com', phone: '09345678902', address: 'Purok 3, Barangay Gomez', birthdate: '1975-03-10', status: 'Active', registeredAt: '2026-01-14' },
                    { id: 4, name: 'Ana Bautista', email: 'ana.bautista@email.com', phone: '09456789013', address: 'Purok 1, Barangay Gomez', birthdate: '1992-07-19', status: 'Active', registeredAt: '2026-01-18' },
                    { id: 5, name: 'Ramon Garcia', email: 'ramon.garcia@email.com', phone: '09567890124', address: 'Purok 4, Barangay Gomez', birthdate: '1983-12-05', status: 'Active', registeredAt: '2026-01-20' },
                    { id: 6, name: 'Liza Mendoza', email: 'liza.mendoza@email.com', phone: '09678901235', address: 'Purok 2, Barangay Gomez', birthdate: '1995-02-28', status: 'Active', registeredAt: '2026-02-02' },
                    { id: 7, name: 'Carlos Villanueva', email: 'carlos.v@email.com', phone: '09789012346', address: 'Purok 5, Barangay Gomez', birthdate: '1979-06-11', status: 'Active', registeredAt: '2026-02-08' },
                    { id: 8, name: 'Rosa Fernandez', email: 'rosa.fernandez@email.com', phone: '09890123457', address: 'Purok 3, Barangay Gomez', birthdate: '1991-10-30', status: 'Active', registeredAt: '2026-02-15' },
                    { id: 9, name: 'Eduardo Torres', email: 'eduardo.torres@email.com', phone: '09901234568', address: 'Purok 6, Barangay Gomez', birthdate: '1987-04-17', status: 'Active', registeredAt: '2026-03-01' },
                    { id: 10, name: 'Cristina Aquino', email: 'cristina.aquino@email.com', phone: '09112345679', address: 'Purok 1, Barangay Gomez', birthdate: '1993-08-23', status: 'Active', registeredAt: '2026-03-10' },
                    { id: 11, name: 'Manuel Ocampo', email: 'manuel.ocampo@email.com', phone: '09223456780', address: 'Purok 4, Barangay Gomez', birthdate: '1981-01-09', status: 'Active', registeredAt: '2026-03-22' },
                    { id: 12, name: 'Teresa Domingo', email: 'teresa.domingo@email.com', phone: '09334567891', address: 'Purok 2, Barangay Gomez', birthdate: '1996-05-06', status: 'Active', registeredAt: '2026-04-05' },
                    { id: 13, name: 'Ferdinand Cruz', email: 'ferdinand.cruz@email.com', phone: '09445678902', address: 'Purok 5, Barangay Gomez', birthdate: '1978-09-14', status: 'Active', registeredAt: '2026-04-18' },
                    { id: 14, name: 'Josefina Ramirez', email: 'josefina.ramirez@email.com', phone: '09556789013', address: 'Purok 3, Barangay Gomez', birthdate: '1990-11-27', status: 'Active', registeredAt: '2026-05-02' },
                    { id: 15, name: 'Antonio Pascual', email: 'antonio.pascual@email.com', phone: '09667890124', address: 'Purok 6, Barangay Gomez', birthdate: '1984-03-03', status: 'Active', registeredAt: '2026-05-20' },
                    { id: 16, name: 'Corazon Lim', email: 'corazon.lim@email.com', phone: '09778901235', address: 'Purok 4, Barangay Gomez', birthdate: '1989-07-08', status: 'Inactive', registeredAt: '2026-06-01' },
                ],
                complaints: [
                    { id: 1, referenceNumber: 'BG-2026-0001', residentId: 1, residentName: 'Juan Dela Cruz', category: 'Noise Complaint', description: 'Loud karaoke every night until 2AM from the house across the street.', status: 'Resolved', priority: 'Medium', assignedTo: 2, notes: [{ date: '2026-01-08', author: 'Maria Santos', note: 'Talked to the household, agreed to a 10PM cutoff.' }], evidence: [], inspections: [], createdAt: '2026-01-05', updatedAt: '2026-01-10', resolvedAt: '2026-01-10' },
                    { id: 2, referenceNumber: 'BG-2026-0002', residentId: 2, residentName: 'Maria Reyes', category: 'Road Damage', description: 'Large pothole along the main road near the elementary school. Dangerous for vehicles and pedestrians.', status: 'Resolved', priority: 'High', assignedTo: 3, notes: [{ date: '2026-01-12', author: 'Pedro Ramos', note: 'Reported to DPWH for immediate action.' }], evidence: [], inspections: [{ date: '2026-01-14', location: 'Main Road near school', notes: 'Confirmed pothole, scheduled repair.' }], createdAt: '2026-01-09', updatedAt: '2026-01-20', resolvedAt: '2026-01-20' },
                    { id: 3, referenceNumber: 'BG-2026-0003', residentId: 3, residentName: 'Pedro Santos', category: 'Sanitation and Waste', description: 'Uncollected garbage piling up near the corner store for over a week.', status: 'Closed', priority: 'Medium', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-01-15', updatedAt: '2026-01-22', resolvedAt: '2026-01-22' },
                    { id: 4, referenceNumber: 'BG-2026-0004', residentId: 4, residentName: 'Ana Bautista', category: 'Streetlight Issues', description: 'Streetlight along Purok 1 has been out for two weeks, making the area unsafe at night.', status: 'Resolved', priority: 'Medium', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-01-25', updatedAt: '2026-02-01', resolvedAt: '2026-02-01' },
                    { id: 5, referenceNumber: 'BG-2026-0005', residentId: 5, residentName: 'Ramon Garcia', category: 'Illegal Parking', description: 'Delivery trucks regularly block the narrow street during school hours.', status: 'Closed', priority: 'Low', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-02-03', updatedAt: '2026-02-10', resolvedAt: '2026-02-10' },
                    { id: 6, referenceNumber: 'BG-2026-0006', residentId: 6, residentName: 'Liza Mendoza', category: 'Drainage/Flooding', description: 'Clogged drainage causing flash floods on the street whenever it rains.', status: 'Resolved', priority: 'High', assignedTo: 3, notes: [{ date: '2026-02-12', author: 'Pedro Ramos', note: 'Coordinated with the drainage maintenance team.' }], evidence: [], inspections: [{ date: '2026-02-13', location: 'Purok 2 main street', notes: 'Drainage cleared of debris.' }], createdAt: '2026-02-08', updatedAt: '2026-02-15', resolvedAt: '2026-02-15' },
                    { id: 7, referenceNumber: 'BG-2026-0007', residentId: 7, residentName: 'Carlos Villanueva', category: 'Animal-Related Complaints', description: 'Stray dogs roaming in packs near the basketball court, residents feel unsafe.', status: 'Closed', priority: 'Medium', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-02-14', updatedAt: '2026-02-20', resolvedAt: '2026-02-20' },
                    { id: 8, referenceNumber: 'BG-2026-0008', residentId: 8, residentName: 'Rosa Fernandez', category: 'Water Supply Problems', description: 'Low water pressure in the area for the past three days.', status: 'Resolved', priority: 'Medium', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-02-20', updatedAt: '2026-02-26', resolvedAt: '2026-02-26' },
                    { id: 9, referenceNumber: 'BG-2026-0009', residentId: 9, residentName: 'Eduardo Torres', category: 'Neighborhood Dispute', description: 'Ongoing boundary dispute between two neighboring households over a fence.', status: 'Resolved', priority: 'Medium', assignedTo: 2, notes: [{ date: '2026-03-05', author: 'Maria Santos', note: 'Mediation session conducted at the barangay hall.' }], evidence: [], inspections: [], createdAt: '2026-03-02', updatedAt: '2026-03-08', resolvedAt: '2026-03-08' },
                    { id: 10, referenceNumber: 'BG-2026-0010', residentId: 10, residentName: 'Cristina Aquino', category: 'Public Safety Concerns', description: 'Broken sidewalk tiles near the covered court pose a tripping hazard.', status: 'Ongoing', priority: 'Medium', assignedTo: 3, notes: [{ date: '2026-03-15', author: 'Pedro Ramos', note: 'Materials requested for repair.' }], evidence: [], inspections: [{ date: '2026-03-16', location: 'Covered court sidewalk', notes: 'Damage confirmed, repair scheduled.' }], createdAt: '2026-03-12', updatedAt: '2026-03-16', resolvedAt: null },
                    { id: 11, referenceNumber: 'BG-2026-0011', residentId: 11, residentName: 'Manuel Ocampo', category: 'Environmental Issues', description: 'Open burning of trash producing heavy smoke near residential homes.', status: 'Resolved', priority: 'High', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-03-20', updatedAt: '2026-03-25', resolvedAt: '2026-03-25' },
                    { id: 12, referenceNumber: 'BG-2026-0012', residentId: 1, residentName: 'Juan Dela Cruz', category: 'Noise Complaint', description: 'Construction work starting before 6AM disturbing residents.', status: 'Closed', priority: 'Low', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-03-28', updatedAt: '2026-04-02', resolvedAt: '2026-04-02' },
                    { id: 13, referenceNumber: 'BG-2026-0013', residentId: 12, residentName: 'Teresa Domingo', category: 'Road Damage', description: 'Cracked road surface widening after recent rains, needs urgent patching.', status: 'Ongoing', priority: 'High', assignedTo: 3, notes: [{ date: '2026-04-10', author: 'Pedro Ramos', note: 'Patch materials delivered, work in progress.' }], evidence: [], inspections: [], createdAt: '2026-04-06', updatedAt: '2026-04-10', resolvedAt: null },
                    { id: 14, referenceNumber: 'BG-2026-0014', residentId: 13, residentName: 'Ferdinand Cruz', category: 'Sanitation and Waste', description: 'Garbage collection schedule not being followed in Purok 5.', status: 'Under Review', priority: 'Medium', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-04-15', updatedAt: '2026-04-16', resolvedAt: null },
                    { id: 15, referenceNumber: 'BG-2026-0015', residentId: 14, residentName: 'Josefina Ramirez', category: 'Streetlight Issues', description: 'Flickering streetlight near the chapel, may need replacement.', status: 'Resolved', priority: 'Low', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-04-20', updatedAt: '2026-04-27', resolvedAt: '2026-04-27' },
                    { id: 16, referenceNumber: 'BG-2026-0016', residentId: 15, residentName: 'Antonio Pascual', category: 'Drainage/Flooding', description: 'Overflowing canal behind the market during heavy rains.', status: 'Ongoing', priority: 'Urgent', assignedTo: 2, notes: [{ date: '2026-05-04', author: 'Maria Santos', note: 'Escalated to municipal engineering office.' }], evidence: [], inspections: [{ date: '2026-05-05', location: 'Canal behind the market', notes: 'Significant siltation observed.' }], createdAt: '2026-05-01', updatedAt: '2026-05-05', resolvedAt: null },
                    { id: 17, referenceNumber: 'BG-2026-0017', residentId: 2, residentName: 'Maria Reyes', category: 'Illegal Parking', description: 'Tricycles parked along the road overnight, blocking one lane.', status: 'Resolved', priority: 'Low', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-05-08', updatedAt: '2026-05-14', resolvedAt: '2026-05-14' },
                    { id: 18, referenceNumber: 'BG-2026-0018', residentId: 16, residentName: 'Corazon Lim', category: 'Animal-Related Complaints', description: 'Neighbor\u2019s pigs kept in poor sanitary condition, causing bad odor.', status: 'Under Review', priority: 'Medium', assignedTo: 2, notes: [], evidence: [], inspections: [], createdAt: '2026-05-18', updatedAt: '2026-05-19', resolvedAt: null },
                    { id: 19, referenceNumber: 'BG-2026-0019', residentId: 5, residentName: 'Ramon Garcia', category: 'Water Supply Problems', description: 'No water supply for two consecutive days in Purok 4.', status: 'Resolved', priority: 'High', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-06-02', updatedAt: '2026-06-05', resolvedAt: '2026-06-05' },
                    { id: 20, referenceNumber: 'BG-2026-0020', residentId: 7, residentName: 'Carlos Villanueva', category: 'Public Safety Concerns', description: 'Faulty electrical wiring exposed near a utility post, fire hazard.', status: 'Ongoing', priority: 'Urgent', assignedTo: 2, notes: [{ date: '2026-06-11', author: 'Maria Santos', note: 'Reported to the electric cooperative for urgent repair.' }], evidence: [], inspections: [], createdAt: '2026-06-10', updatedAt: '2026-06-11', resolvedAt: null },
                    { id: 21, referenceNumber: 'BG-2026-0021', residentId: 9, residentName: 'Eduardo Torres', category: 'Other Community Concerns', description: 'Request for additional waiting shed near the tricycle terminal.', status: 'Pending', priority: 'Low', assignedTo: null, notes: [], evidence: [], inspections: [], createdAt: '2026-06-20', updatedAt: '2026-06-20', resolvedAt: null },
                    { id: 22, referenceNumber: 'BG-2026-0022', residentId: 10, residentName: 'Cristina Aquino', category: 'Noise Complaint', description: 'Videoke rentals used late at night on weekends, disturbing sleep.', status: 'Pending', priority: 'Medium', assignedTo: null, notes: [], evidence: [], inspections: [], createdAt: '2026-07-03', updatedAt: '2026-07-03', resolvedAt: null },
                    { id: 23, referenceNumber: 'BG-2026-0023', residentId: 11, residentName: 'Manuel Ocampo', category: 'Road Damage', description: 'Newly widened pothole near the basketball court after last week\u2019s storm.', status: 'Under Review', priority: 'High', assignedTo: 3, notes: [], evidence: [], inspections: [], createdAt: '2026-07-15', updatedAt: '2026-07-16', resolvedAt: null },
                    { id: 24, referenceNumber: 'BG-2026-0024', residentId: 3, residentName: 'Pedro Santos', category: 'Sanitation and Waste', description: 'Illegal dumping of construction debris along the creek.', status: 'Pending', priority: 'Medium', assignedTo: null, notes: [], evidence: [], inspections: [], createdAt: '2026-07-28', updatedAt: '2026-07-28', resolvedAt: null },
                    { id: 25, referenceNumber: 'BG-2026-0025', residentId: 12, residentName: 'Teresa Domingo', category: 'Environmental Issues', description: 'Foul smell from an unmaintained vacant lot used as a dump site.', status: 'Pending', priority: 'Medium', assignedTo: null, notes: [], evidence: [], inspections: [], createdAt: '2026-08-05', updatedAt: '2026-08-05', resolvedAt: null },
                    { id: 26, referenceNumber: 'BG-2026-0026', residentId: 8, residentName: 'Rosa Fernandez', category: 'Streetlight Issues', description: 'Two streetlights simultaneously out near the chapel intersection.', status: 'Ongoing', priority: 'Medium', assignedTo: 2, notes: [{ date: '2026-08-09', author: 'Maria Santos', note: 'Reported to the barangay engineering aide for replacement.' }], evidence: [], inspections: [], createdAt: '2026-08-07', updatedAt: '2026-08-09', resolvedAt: null },
                ],
                announcements: [
                    { id: 1, title: 'Barangay Assembly 2026', content: 'The general assembly will be held on August 20, 2026 at the barangay hall. All residents are encouraged to attend.', author: 'Admin Gomez', date: '2026-08-01', isPinned: true },
                    { id: 2, title: 'Free Medical Mission', content: 'A free medical mission will be conducted on August 25, 2026 from 8AM to 5PM at the barangay covered court. Bring your family!', author: 'Admin Gomez', date: '2026-08-03', isPinned: false },
                    { id: 3, title: 'Garbage Collection Schedule Update', content: 'Starting July, garbage trucks will collect waste every Monday, Wednesday, and Friday. Please segregate biodegradable and non-biodegradable waste.', author: 'Maria Santos', date: '2026-06-28', isPinned: false },
                    { id: 4, title: 'Rabies Vaccination Drive for Pets', content: 'Free anti-rabies vaccination for dogs and cats will be held at the barangay hall on May 15, 2026. Bring your pets and their vaccination cards.', author: 'Pedro Ramos', date: '2026-05-10', isPinned: false },
                    { id: 5, title: '1967 Founding Anniversary Celebration', content: 'Barangay Gomez celebrates its founding anniversary this year with a community fiesta, sports fest, and cultural night. Schedule of activities to follow.', author: 'Admin Gomez', date: '2026-03-15', isPinned: true },
                ],
                activityLogs: [
                    { id: 1, userId: 1, userName: 'Admin Gomez', action: 'Logged in', timestamp: '2026-08-06 09:00:00' },
                    { id: 2, userId: 1, userName: 'Admin Gomez', action: 'Created complaint BG-2026-0001', timestamp: '2026-01-05 10:15:00' },
                    { id: 3, userId: 2, userName: 'Maria Santos', action: 'Updated status of BG-2026-0006 to Resolved', timestamp: '2026-02-15 14:20:00' },
                    { id: 4, userId: 3, userName: 'Pedro Ramos', action: 'Logged an inspection for BG-2026-0013', timestamp: '2026-04-10 11:05:00' },
                    { id: 5, userId: 1, userName: 'Admin Gomez', action: 'Posted announcement: 1967 Founding Anniversary Celebration', timestamp: '2026-03-15 08:30:00' },
                    { id: 6, userId: 2, userName: 'Maria Santos', action: 'Escalated BG-2026-0016 to municipal engineering office', timestamp: '2026-05-05 09:45:00' },
                    { id: 7, userId: 3, userName: 'Pedro Ramos', action: 'Registered resident Corazon Lim', timestamp: '2026-06-01 13:10:00' },
                    { id: 8, userId: 2, userName: 'Maria Santos', action: 'Updated status of BG-2026-0026 to Ongoing', timestamp: '2026-08-09 15:40:00' },
                ],
                nextId: { user: 4, resident: 17, complaint: 27, announcement: 6, activityLog: 9 },
                settings: { systemName: 'Barangay Gomez Complaint System', barangayName: 'Barangay Gomez',
                    municipality: 'San Isidro', province: 'Isabela' }
            };
        }

        function loadData() {
            if (!_cache) {
                // Should never happen in normal use — the app waits for the initial
                // /api/data fetch to finish before rendering anything. Fall back to
                // default data so the UI doesn't hard-crash if it ever does.
                console.warn('loadData() called before the database finished loading.');
                _cache = getDefaultData();
            }
            return _cache;
        }

        function saveData(data) {
            _cache = data;
            persistData(data);
        }

        function genId(store, key) {
            const id = (store.nextId[key] || 1);
            store.nextId[key] = id + 1;
            return id;
        }

        function getCurrentUser() {
            try {
                return JSON.parse(sessionStorage.getItem('bg_current_user'));
            } catch (_) { return null; }
        }

        function setCurrentUser(user) {
            sessionStorage.setItem('bg_current_user', JSON.stringify(user));
        }

        function clearCurrentUser() {
            sessionStorage.removeItem('bg_current_user');
        }

        // ─── Helpers ───
        function formatDate(d) {
            if (!d) return '-';
            const dt = new Date(d);
            return dt.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        function formatDateTime(d) {
            if (!d) return '-';
            const dt = new Date(d);
            return dt.toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit',
                minute: '2-digit' });
        }

        function todayStr() {
            return new Date().toISOString().slice(0, 10);
        }

        function nowStr() {
            return new Date().toISOString().replace('T', ' ').slice(0, 19);
        }

        function getStatusBadge(status) {
            const map = {
                'Pending': 'badge-warning',
                'Under Review': 'badge-info',
                'Ongoing': 'badge-primary',
                'Resolved': 'badge-success',
                'Closed': 'badge-secondary',
                'Active': 'badge-success',
                'Inactive': 'badge-secondary',
            };
            const cls = map[status] || 'badge-secondary';
            return `<span class="badge ${cls}">${status}</span>`;
        }

        function getPriorityBadge(priority) {
            const map = { 'Low': 'badge-secondary', 'Medium': 'badge-info', 'High': 'badge-warning', 'Urgent': 'badge-danger' };
            const cls = map[priority] || 'badge-secondary';
            return `<span class="badge ${cls}">${priority}</span>`;
        }

        function generateReferenceNumber() {
            const year = new Date().getFullYear();
            const data = loadData();
            const count = data.complaints.length + 1;
            return `BG-${year}-${String(count).padStart(4, '0')}`;
        }

        function getCategoryIcon(cat) {
            const map = {
                'Noise Complaint': 'fa-volume-up',
                'Neighborhood Dispute': 'fa-handshake',
                'Sanitation and Waste': 'fa-trash',
                'Illegal Parking': 'fa-parking',
                'Road Damage': 'fa-road',
                'Streetlight Issues': 'fa-lightbulb',
                'Water Supply Problems': 'fa-tint',
                'Drainage/Flooding': 'fa-water',
                'Animal-Related Complaints': 'fa-paw',
                'Public Safety Concerns': 'fa-shield-alt',
                'Environmental Issues': 'fa-leaf',
                'Other Community Concerns': 'fa-ellipsis-h'
            };
            return map[cat] || 'fa-exclamation-circle';
        }

        // ─── Toast ───
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const el = document.createElement('div');
            el.className = `toast ${type}`;
            el.textContent = message;
            container.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateX(40px)';
                setTimeout(() => el.remove(), 400);
            }, 3500);
        }

        // ─── Modal ───
        function openModal(title, bodyHTML) {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalBody').innerHTML = bodyHTML;
            document.getElementById('modalOverlay').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('modalOverlay').classList.add('hidden');
        }
        document.getElementById('modalOverlay').addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });

        // ═══════════════════════════════════════════════════════════════
        //  NAVIGATION
        // ═══════════════════════════════════════════════════════════════

        function showLanding() {
            clearCurrentUser();
            document.querySelectorAll('#landingPage, #loginPage, #registerPage, #visitorPage, #appDashboard')
                .forEach(el => el.classList.add('hidden'));
            document.getElementById('landingPage').classList.remove('hidden');
        }

        function showLogin(role) {
            document.querySelectorAll('#landingPage, #loginPage, #registerPage, #visitorPage, #appDashboard')
                .forEach(el => el.classList.add('hidden'));
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('loginError').classList.remove('show');
            document.getElementById('loginForm').reset();
            if (role === 'resident') {
                document.getElementById('loginTitle').textContent = 'Resident Login';
                document.getElementById('loginSub').textContent = 'Login to manage your complaints and profile';
                document.getElementById('registerLink').style.display = 'block';
            } else {
                document.getElementById('loginTitle').textContent = 'Admin / Staff Login';
                document.getElementById('loginSub').textContent = 'Enter your credentials to access the dashboard';
                document.getElementById('registerLink').style.display = 'none';
            }
            // store role hint
            document.getElementById('loginForm').dataset.role = role;
        }

        function showRegister() {
            document.querySelectorAll('#landingPage, #loginPage, #registerPage, #visitorPage, #appDashboard')
                .forEach(el => el.classList.add('hidden'));
            document.getElementById('registerPage').classList.remove('hidden');
            document.getElementById('registerForm').reset();
        }

        function showVisitorPage() {
            document.querySelectorAll('#landingPage, #loginPage, #registerPage, #visitorPage, #appDashboard')
                .forEach(el => el.classList.add('hidden'));
            document.getElementById('visitorPage').classList.remove('hidden');
            renderVisitorAnnouncements();
        }

        function showApp() {
            document.querySelectorAll('#landingPage, #loginPage, #registerPage, #visitorPage, #appDashboard')
                .forEach(el => el.classList.add('hidden'));
            document.getElementById('appDashboard').classList.remove('hidden');
            document.getElementById('appSidebar').classList.remove('open');
            const user = getCurrentUser();
            if (user) {
                document.getElementById('sidebarUserName').textContent = user.name || user.username;
                document.getElementById('sidebarUserRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
                renderSidebarNav(user.role);
                renderDashboard(user.role);
            }
        }

        function toggleSidebar() {
            document.getElementById('appSidebar').classList.toggle('open');
        }
        // close sidebar on outside click
        document.addEventListener('click', function(e) {
            const sidebar = document.getElementById('appSidebar');
            const toggle = document.getElementById('appMobileToggle');
            if (sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // ═══════════════════════════════════════════════════════════════
        //  AUTH
        // ═══════════════════════════════════════════════════════════════

        function handleLogin(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            const data = loadData();
            const user = data.users.find(u => u.username === username && u.password === password);
            if (user) {
                setCurrentUser(user);
                // log activity
                logActivity(user.id, user.name || user.username, 'Logged in');
                showToast(`Welcome, ${user.name || user.username}!`, 'success');
                showApp();
            } else {
                document.getElementById('loginError').classList.add('show');
                showToast('Invalid username or password', 'error');
            }
        }

        function handleRegister(e) {
            e.preventDefault();
            const data = loadData();
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value.trim();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const address = document.getElementById('regAddress').value.trim();
            const birthdate = document.getElementById('regBirthdate').value;

            if (data.users.find(u => u.username === username)) {
                showToast('Username already exists!', 'error');
                return;
            }
            if (data.residents.find(r => r.email === email && email)) {
                showToast('Email already registered!', 'error');
                return;
            }

            // Create resident
            const rid = genId(data, 'resident');
            data.residents.push({
                id: rid,
                name,
                email,
                phone,
                address,
                birthdate,
                status: 'Active',
                registeredAt: todayStr()
            });

            // Create user account
            const uid = genId(data, 'user');
            data.users.push({
                id: uid,
                username,
                password,
                role: 'resident',
                name,
                email,
                phone,
                address,
                birthdate,
                status: 'Active',
                createdAt: todayStr()
            });

            saveData(data);
            showToast('Registration successful! You can now login.', 'success');
            showLogin('resident');
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = '';
            showToast('Account created! Please login.', 'info');
        }

        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                const user = getCurrentUser();
                if (user) logActivity(user.id, user.name || user.username, 'Logged out');
                clearCurrentUser();
                showLanding();
                showToast('Logged out successfully', 'info');
            }
        }

        function logActivity(userId, userName, action) {
            const data = loadData();
            const id = genId(data, 'activityLog');
            data.activityLogs.push({
                id,
                userId,
                userName,
                action,
                timestamp: nowStr()
            });
            saveData(data);
        }

        // ═══════════════════════════════════════════════════════════════
        //  SIDEBAR NAV
        // ═══════════════════════════════════════════════════════════════

        function renderSidebarNav(role) {
            const container = document.getElementById('sidebarNav');
            let items = [];
            if (role === 'admin') {
                items = [
                    { icon: 'fa-chart-pie', label: 'Dashboard', tab: 'dashboard' },
                    { icon: 'fa-exclamation-triangle', label: 'Complaints', tab: 'complaints' },
                    { icon: 'fa-users', label: 'Residents', tab: 'residents' },
                    { icon: 'fa-user-tie', label: 'Staff', tab: 'staff' },
                    { icon: 'fa-bullhorn', label: 'Announcements', tab: 'announcements' },
                    { icon: 'fa-history', label: 'Activity Logs', tab: 'activity' },
                    { icon: 'fa-chart-bar', label: 'Reports', tab: 'reports' },
                    { icon: 'fa-cog', label: 'Settings', tab: 'settings' },
                ];
            } else if (role === 'staff') {
                items = [
                    { icon: 'fa-chart-pie', label: 'Dashboard', tab: 'dashboard' },
                    { icon: 'fa-exclamation-triangle', label: 'Complaints', tab: 'complaints' },
                    { icon: 'fa-users', label: 'Residents', tab: 'residents' },
                    { icon: 'fa-bullhorn', label: 'Announcements', tab: 'announcements' },
                    { icon: 'fa-chart-bar', label: 'Reports', tab: 'reports' },
                ];
            } else { // resident
                items = [
                    { icon: 'fa-chart-pie', label: 'Dashboard', tab: 'dashboard' },
                    { icon: 'fa-user', label: 'My Profile', tab: 'profile' },
                    { icon: 'fa-exclamation-circle', label: 'My Complaints', tab: 'my-complaints' },
                    { icon: 'fa-plus-circle', label: 'New Complaint', tab: 'new-complaint' },
                    { icon: 'fa-bullhorn', label: 'Announcements', tab: 'announcements' },
                ];
            }
            container.innerHTML = items.map(item => `
                    <div class="nav-item ${item.tab === 'dashboard' ? 'active' : ''}" data-tab="${item.tab}" onclick="switchTab('${item.tab}')">
                        <i class="fas ${item.icon}"></i> ${item.label}
                    </div>
                `).join('');
        }

        let currentTab = 'dashboard';

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('#sidebarNav .nav-item').forEach(el => {
                el.classList.toggle('active', el.dataset.tab === tab);
            });
            const user = getCurrentUser();
            if (user) renderTabContent(tab, user.role);
            document.getElementById('appSidebar').classList.remove('open');
        }

        function renderTabContent(tab, role) {
            const container = document.getElementById('appContent');
            switch (tab) {
                case 'dashboard':
                    renderDashboard(role);
                    break;
                case 'complaints':
                    renderComplaints(role);
                    break;
                case 'residents':
                    renderResidents(role);
                    break;
                case 'staff':
                    renderStaff();
                    break;
                case 'announcements':
                    renderAnnouncements(role);
                    break;
                case 'activity':
                    renderActivityLogs();
                    break;
                case 'reports':
                    renderReports();
                    break;
                case 'settings':
                    renderSettings();
                    break;
                case 'profile':
                    renderProfile();
                    break;
                case 'my-complaints':
                    renderMyComplaints();
                    break;
                case 'new-complaint':
                    renderNewComplaint();
                    break;
                default:
                    container.innerHTML = '<p>Page not found.</p>';
            }
        }

        function renderDashboard(role) {
            const container = document.getElementById('appContent');
            const data = loadData();
            const user = getCurrentUser();

            let stats = {};
            if (role === 'admin' || role === 'staff') {
                const totalComplaints = data.complaints.length;
                const pending = data.complaints.filter(c => c.status === 'Pending').length;
                const review = data.complaints.filter(c => c.status === 'Under Review').length;
                const resolved = data.complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
                const totalResidents = data.residents.length;
                const totalStaff = data.users.filter(u => u.role === 'staff').length;
                stats = { totalComplaints, pending, review, resolved, totalResidents, totalStaff };
            } else {
                const myComplaints = data.complaints.filter(c => c.residentId === user.id);
                const pending = myComplaints.filter(c => c.status === 'Pending' || c.status === 'Under Review').length;
                const resolved = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
                stats = { total: myComplaints.length, pending, resolved };
            }

            let html = `
                    <div class="page-header">
                        <div><h2>Dashboard</h2><div class="sub">${role === 'resident' ? 'Welcome back, ' + (user.name || user.username) : 'Overview of Barangay Gomez operations'}</div></div>
                    </div>
                `;

            if (role === 'admin' || role === 'staff') {
                html += `
                        <div class="stats-grid">
                            <div class="stat-card"><div class="icon"><i class="fas fa-exclamation-triangle"></i></div><div class="num">${stats.totalComplaints}</div><div class="label">Total Complaints</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-clock"></i></div><div class="num">${stats.pending}</div><div class="label">Pending</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-search"></i></div><div class="num">${stats.review}</div><div class="label">Under Review</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-check-circle"></i></div><div class="num">${stats.resolved}</div><div class="label">Resolved</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-users"></i></div><div class="num">${stats.totalResidents}</div><div class="label">Residents</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-user-tie"></i></div><div class="num">${stats.totalStaff}</div><div class="label">Staff</div></div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
                            <div class="card">
                                <div class="card-header"><span>📋 Recent Complaints</span> <button class="btn btn-sm btn-primary" onclick="switchTab('complaints')">View All</button></div>
                                ${data.complaints.slice(0,4).map(c => `
                                    <div style="padding:8px 0;border-bottom:1px solid #f1f3f5;">
                                        <div class="flex-between">
                                            <strong>${c.residentName}</strong>
                                            ${getStatusBadge(c.status)}
                                        </div>
                                        <div style="font-size:0.8rem;color:#6c757d;">${c.category} · ${formatDate(c.createdAt)}</div>
                                        <div style="font-size:0.85rem;">${c.description.slice(0,60)}${c.description.length>60?'...':''}</div>
                                    </div>
                                `).join('') || '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No complaints yet.</p></div>'}
                            </div>
                            <div class="card">
                                <div class="card-header"><span>📢 Announcements</span> <button class="btn btn-sm btn-primary" onclick="switchTab('announcements')">View All</button></div>
                                ${data.announcements.slice(0,3).map(a => `
                                    <div style="padding:8px 0;border-bottom:1px solid #f1f3f5;">
                                        <strong>${a.title}</strong>
                                        <div style="font-size:0.8rem;color:#6c757d;">${formatDate(a.date)}</div>
                                        <div style="font-size:0.85rem;">${a.content.slice(0,50)}${a.content.length>50?'...':''}</div>
                                    </div>
                                `).join('') || '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet.</p></div>'}
                            </div>
                        </div>
                    `;
                // chart for admin/staff
                html += `
                        <div class="chart-container mt-2">
                            <h4 style="margin-bottom:0.8rem;"><i class="fas fa-chart-pie" style="color:var(--primary);"></i> Complaint Status Distribution</h4>
                            <div class="chart-canvas-wrap" style="height:240px;">
                                <canvas id="statusChart"></canvas>
                            </div>
                        </div>
                    `;
            } else {
                // resident dashboard
                html += `
                        <div class="stats-grid">
                            <div class="stat-card"><div class="icon"><i class="fas fa-file-alt"></i></div><div class="num">${stats.total}</div><div class="label">My Complaints</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-clock"></i></div><div class="num">${stats.pending}</div><div class="label">In Progress</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-check-circle"></i></div><div class="num">${stats.resolved}</div><div class="label">Resolved</div></div>
                            <div class="stat-card"><div class="icon"><i class="fas fa-bullhorn"></i></div><div class="num">${data.announcements.length}</div><div class="label">Announcements</div></div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
                            <div class="card">
                                <div class="card-header"><span>⚠️ My Recent Complaints</span> <button class="btn btn-sm btn-primary" onclick="switchTab('my-complaints')">View All</button></div>
                                ${data.complaints.filter(c => c.residentId === user.id).slice(0,3).map(c => `
                                    <div style="padding:8px 0;border-bottom:1px solid #f1f3f5;">
                                        <div class="flex-between">
                                            <strong>${c.category}</strong>
                                            ${getStatusBadge(c.status)}
                                        </div>
                                        <div style="font-size:0.8rem;color:#6c757d;">Ref: ${c.referenceNumber} · ${formatDate(c.createdAt)}</div>
                                    </div>
                                `).join('') || '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No complaints submitted yet.</p></div>'}
                            </div>
                            <div class="card">
                                <div class="card-header"><span>📢 Announcements</span> <button class="btn btn-sm btn-primary" onclick="switchTab('announcements')">View All</button></div>
                                ${data.announcements.slice(0,3).map(a => `
                                    <div style="padding:8px 0;border-bottom:1px solid #f1f3f5;">
                                        <strong>${a.title}</strong>
                                        <div style="font-size:0.8rem;color:#6c757d;">${formatDate(a.date)}</div>
                                    </div>
                                `).join('') || '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet.</p></div>'}
                            </div>
                        </div>
                    `;
            }

            container.innerHTML = html;

            // Draw chart if admin/staff
            if (role === 'admin' || role === 'staff') {
                setTimeout(() => drawStatusChart(), 100);
            }
        }

        // ─── Chart.js instance registry (prevents "canvas already in use" errors on re-render) ───
        const chartRegistry = {};
        function destroyChart(key) {
            if (chartRegistry[key]) {
                chartRegistry[key].destroy();
                delete chartRegistry[key];
            }
        }

        // Plugin: draws a total count in the center of any doughnut chart that has a `centerText` option
        const centerTextPlugin = {
            id: 'centerText',
            afterDraw(chart) {
                const opts = chart.config.options.plugins.centerText;
                if (!opts || !opts.display) return;
                const { ctx, chartArea: { left, right, top, bottom } } = chart;
                const cx = (left + right) / 2;
                const cy = (top + bottom) / 2;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#1a1a2e';
                ctx.font = '700 22px "Segoe UI", sans-serif';
                ctx.fillText(opts.value, cx, cy - 10);
                ctx.fillStyle = '#6c757d';
                ctx.font = '600 11px "Segoe UI", sans-serif';
                ctx.fillText(opts.label || 'Total', cx, cy + 12);
                ctx.restore();
            }
        };
        if (window.Chart) Chart.register(centerTextPlugin);

        function drawStatusChart() {
            const canvas = document.getElementById('statusChart');
            if (!canvas || !window.Chart) return;
            destroyChart('statusChart');

            const data = loadData();
            const statuses = ['Pending', 'Under Review', 'Ongoing', 'Resolved', 'Closed'];
            const colors = ['#ffc107', '#17a2b8', '#004085', '#28a745', '#6c757d'];
            const counts = statuses.map(s => data.complaints.filter(c => c.status === s).length);
            const total = counts.reduce((a, b) => a + b, 0);

            chartRegistry.statusChart = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: statuses,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 3,
                        hoverOffset: 10,
                        borderRadius: 6,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    animation: { animateRotate: true, animateScale: true, duration: 700, easing: 'easeOutQuart' },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 12,
                                font: { size: 11, family: "'Segoe UI', sans-serif" },
                                color: '#1a1a2e'
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a2e',
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: (ctx) => {
                                    const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                    return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                                }
                            }
                        },
                        centerText: { display: true, value: total, label: total === 1 ? 'Complaint' : 'Complaints' }
                    }
                }
            });
        }

        // ─── COMPLAINTS (Admin/Staff) ───
        function renderComplaints(role) {
            const container = document.getElementById('appContent');
            const data = loadData();
            const staff = data.users.filter(u => u.role === 'staff' || u.role === 'admin');

            let html = `
                    <div class="page-header">
                        <div><h2>Complaints Management</h2><div class="sub">View, filter, and manage all complaints</div></div>
                        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <span class="badge badge-warning">Pending: ${data.complaints.filter(c=>c.status==='Pending').length}</span>
                            <span class="badge badge-info">Review: ${data.complaints.filter(c=>c.status==='Under Review').length}</span>
                            <span class="badge badge-success">Resolved: ${data.complaints.filter(c=>c.status==='Resolved'||c.status==='Closed').length}</span>
                        </div>
                    </div>
                    <div class="filter-bar">
                        <input type="text" id="complaintSearch" placeholder="Search by ref or resident..." oninput="filterComplaints()" />
                        <select id="complaintStatusFilter" onchange="filterComplaints()">
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                        <select id="complaintCategoryFilter" onchange="filterComplaints()">
                            <option value="">All Categories</option>
                            ${getComplaintCategories().map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                        <button class="btn btn-sm btn-primary" onclick="filterComplaints()"><i class="fas fa-search"></i> Filter</button>
                        <button class="btn btn-sm btn-secondary" onclick="resetComplaintFilters()"><i class="fas fa-undo"></i> Reset</button>
                        <button class="btn btn-sm btn-success" onclick="exportComplaintsReport()"><i class="fas fa-file-excel"></i> Export</button>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>Ref #</th><th>Resident</th><th>Category</th><th>Description</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Actions</th></tr></thead>
                            <tbody id="complaintTableBody">
                                ${data.complaints.map(c => `
                                    <tr data-id="${c.id}">
                                        <td><span class="reference-tag">${c.referenceNumber}</span></td>
                                        <td><strong>${c.residentName}</strong></td>
                                        <td><i class="fas ${getCategoryIcon(c.category)}" style="color:var(--primary);"></i> ${c.category}</td>
                                        <td><span class="truncate" title="${c.description}">${c.description}</span></td>
                                        <td>${getStatusBadge(c.status)}</td>
                                        <td>${getPriorityBadge(c.priority || 'Medium')}</td>
                                        <td>${c.assignedTo ? (data.users.find(u=>u.id===c.assignedTo)?.name || 'Unknown') : 'Unassigned'}</td>
                                        <td>
                                            <div class="actions">
                                                <button class="btn btn-xs btn-primary" onclick="viewComplaint(${c.id})"><i class="fas fa-eye"></i></button>
                                                <button class="btn btn-xs btn-warning" onclick="editComplaint(${c.id})"><i class="fas fa-edit"></i></button>
                                                ${role === 'admin' ? `<button class="btn btn-xs btn-danger" onclick="deleteComplaint(${c.id})"><i class="fas fa-trash"></i></button>` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') || `<tr><td colspan="8" class="empty-state"><i class="fas fa-check-circle"></i><p>No complaints found.</p></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                `;
            container.innerHTML = html;
        }

        function filterComplaints() {
            const search = document.getElementById('complaintSearch').value.toLowerCase();
            const status = document.getElementById('complaintStatusFilter').value;
            const category = document.getElementById('complaintCategoryFilter').value;
            const data = loadData();
            let filtered = data.complaints;
            if (search) filtered = filtered.filter(c =>
                c.referenceNumber.toLowerCase().includes(search) ||
                c.residentName.toLowerCase().includes(search) ||
                c.category.toLowerCase().includes(search)
            );
            if (status) filtered = filtered.filter(c => c.status === status);
            if (category) filtered = filtered.filter(c => c.category === category);

            const tbody = document.getElementById('complaintTableBody');
            if (!tbody) return;
            if (filtered.length === 0) {
                tbody.innerHTML =
                    `<tr><td colspan="8" class="empty-state"><i class="fas fa-search"></i><p>No matching complaints.</p></td></tr>`;
                return;
            }
            const data2 = loadData();
            tbody.innerHTML = filtered.map(c => `
                        <tr data-id="${c.id}">
                            <td><span class="reference-tag">${c.referenceNumber}</span></td>
                            <td><strong>${c.residentName}</strong></td>
                            <td><i class="fas ${getCategoryIcon(c.category)}" style="color:var(--primary);"></i> ${c.category}</td>
                            <td><span class="truncate" title="${c.description}">${c.description}</span></td>
                            <td>${getStatusBadge(c.status)}</td>
                            <td>${getPriorityBadge(c.priority || 'Medium')}</td>
                            <td>${c.assignedTo ? (data2.users.find(u=>u.id===c.assignedTo)?.name || 'Unknown') : 'Unassigned'}</td>
                            <td>
                                <div class="actions">
                                    <button class="btn btn-xs btn-primary" onclick="viewComplaint(${c.id})"><i class="fas fa-eye"></i></button>
                                    <button class="btn btn-xs btn-warning" onclick="editComplaint(${c.id})"><i class="fas fa-edit"></i></button>
                                    ${getCurrentUser()?.role === 'admin' ? `<button class="btn btn-xs btn-danger" onclick="deleteComplaint(${c.id})"><i class="fas fa-trash"></i></button>` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('');
        }

        function resetComplaintFilters() {
            document.getElementById('complaintSearch').value = '';
            document.getElementById('complaintStatusFilter').value = '';
            document.getElementById('complaintCategoryFilter').value = '';
            filterComplaints();
        }

        function getComplaintCategories() {
            return [
                'Noise Complaint', 'Neighborhood Dispute', 'Sanitation and Waste', 'Illegal Parking',
                'Road Damage', 'Streetlight Issues', 'Water Supply Problems', 'Drainage/Flooding',
                'Animal-Related Complaints', 'Public Safety Concerns', 'Environmental Issues',
                'Other Community Concerns'
            ];
        }

        // ─── VIEW COMPLAINT ───
        function viewComplaint(id) {
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            const user = getCurrentUser();
            const isStaff = user.role === 'admin' || user.role === 'staff';

            let html = `
                    <div style="display:grid;gap:0.8rem;">
                        <div class="flex-between"><strong>Reference:</strong> <span class="reference-tag">${c.referenceNumber}</span></div>
                        <div class="flex-between"><strong>Resident:</strong> ${c.residentName}</div>
                        <div class="flex-between"><strong>Category:</strong> <i class="fas ${getCategoryIcon(c.category)}"></i> ${c.category}</div>
                        <div><strong>Description:</strong><br>${c.description}</div>
                        <div class="flex-between"><strong>Status:</strong> ${getStatusBadge(c.status)}</div>
                        <div class="flex-between"><strong>Priority:</strong> ${getPriorityBadge(c.priority || 'Medium')}</div>
                        <div class="flex-between"><strong>Assigned To:</strong> ${c.assignedTo ? (data.users.find(u=>u.id===c.assignedTo)?.name || 'Unknown') : 'Unassigned'}</div>
                        <div class="flex-between"><strong>Created:</strong> ${formatDateTime(c.createdAt)}</div>
                        ${c.resolvedAt ? `<div class="flex-between"><strong>Resolved:</strong> ${formatDateTime(c.resolvedAt)}</div>` : ''}
                    </div>
                `;

            // Evidence
            if (c.evidence && c.evidence.length > 0) {
                html += `<div class="mt-2"><strong>Evidence:</strong><div class="evidence-list mt-1">`;
                c.evidence.forEach((e, i) => {
                    if (e.dataURL) {
                        html += `<div><a href="${e.dataURL}" target="_blank"><img src="${e.dataURL}" class="evidence-thumb" alt="Evidence ${i+1}" /></a></div>`;
                    } else {
                        html += `<span class="badge badge-secondary">${e.name || 'File'}</span>`;
                    }
                });
                html += `</div></div>`;
            }

            // Notes
            if (c.notes && c.notes.length > 0) {
                html += `<div class="mt-2"><strong>Investigation Notes:</strong>`;
                c.notes.forEach(n => {
                    html +=
                        `<div class="note-item"><div>${n.note}</div><div class="meta">${n.author} · ${formatDateTime(n.date)}</div></div>`;
                });
                html += `</div>`;
            }

            // Inspections
            if (c.inspections && c.inspections.length > 0) {
                html += `<div class="mt-2"><strong>Inspections / Meetings:</strong>`;
                c.inspections.forEach(n => {
                    html +=
                        `<div class="note-item"><div><strong>${n.location}</strong> — ${n.notes}</div><div class="meta">${formatDateTime(n.date)}</div></div>`;
                });
                html += `</div>`;
            }

            if (isStaff) {
                html += `
                        <div class="mt-2" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                            <button class="btn btn-sm btn-primary" onclick="closeModal();editComplaint(${c.id})"><i class="fas fa-edit"></i> Manage</button>
                            <button class="btn btn-sm btn-success" onclick="closeModal();addComplaintNote(${c.id})"><i class="fas fa-plus"></i> Add Note</button>
                            <button class="btn btn-sm btn-info" onclick="closeModal();scheduleInspection(${c.id})"><i class="fas fa-calendar-plus"></i> Schedule</button>
                        </div>
                    `;
            }

            openModal(`Complaint ${c.referenceNumber}`, html);
        }

        // ─── EDIT COMPLAINT ───
        function editComplaint(id) {
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            const staff = data.users.filter(u => u.role === 'staff' || u.role === 'admin');

            openModal(`Manage Complaint ${c.referenceNumber}`, `
                    <form id="editComplaintForm" onsubmit="updateComplaint(${id}, event)">
                        <div class="form-group"><label>Status</label>
                            <select id="ecStatus">
                                <option value="Pending" ${c.status==='Pending'?'selected':''}>Pending</option>
                                <option value="Under Review" ${c.status==='Under Review'?'selected':''}>Under Review</option>
                                <option value="Ongoing" ${c.status==='Ongoing'?'selected':''}>Ongoing</option>
                                <option value="Resolved" ${c.status==='Resolved'?'selected':''}>Resolved</option>
                                <option value="Closed" ${c.status==='Closed'?'selected':''}>Closed</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Priority</label>
                            <select id="ecPriority">
                                <option value="Low" ${c.priority==='Low'?'selected':''}>Low</option>
                                <option value="Medium" ${c.priority==='Medium'?'selected':''}>Medium</option>
                                <option value="High" ${c.priority==='High'?'selected':''}>High</option>
                                <option value="Urgent" ${c.priority==='Urgent'?'selected':''}>Urgent</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Assign To</label>
                            <select id="ecAssign">
                                <option value="">Unassigned</option>
                                ${staff.map(u => `<option value="${u.id}" ${c.assignedTo===u.id?'selected':''}>${u.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Response / Action Notes</label>
                            <textarea id="ecResponse" placeholder="Add action taken or response...">${c.notes && c.notes.length > 0 ? c.notes[c.notes.length-1]?.note || '' : ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Update Complaint</button>
                    </form>
                `);
        }

        function updateComplaint(id, e) {
            e.preventDefault();
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            const newStatus = document.getElementById('ecStatus').value;
            const newPriority = document.getElementById('ecPriority').value;
            const assignedTo = document.getElementById('ecAssign').value ? parseInt(document.getElementById('ecAssign').value) :
                null;
            const response = document.getElementById('ecResponse').value.trim();

            if (response) {
                const user = getCurrentUser();
                c.notes.push({ date: nowStr(), author: user.name || user.username, note: response });
            }
            c.status = newStatus;
            c.priority = newPriority;
            c.assignedTo = assignedTo;
            c.updatedAt = nowStr();
            if (newStatus === 'Resolved' || newStatus === 'Closed') {
                c.resolvedAt = nowStr();
            }
            saveData(data);
            closeModal();
            showToast('Complaint updated successfully!', 'success');
            logActivity(getCurrentUser().id, getCurrentUser().name || getCurrentUser().username,
                `Updated complaint ${c.referenceNumber} to ${newStatus}`);
            switchTab('complaints');
        }

        function deleteComplaint(id) {
            if (!confirm('Delete this complaint permanently?')) return;
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (c) {
                logActivity(getCurrentUser().id, getCurrentUser().name || getCurrentUser().username,
                    `Deleted complaint ${c.referenceNumber}`);
            }
            data.complaints = data.complaints.filter(x => x.id !== id);
            saveData(data);
            showToast('Complaint deleted.', 'info');
            switchTab('complaints');
        }

        function addComplaintNote(id) {
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            openModal(`Add Note to ${c.referenceNumber}`, `
                    <form id="addNoteForm" onsubmit="submitComplaintNote(${id}, event)">
                        <div class="form-group"><label>Note / Action Taken</label>
                            <textarea id="noteText" required placeholder="Enter investigation notes or action taken..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-plus"></i> Add Note</button>
                    </form>
                `);
        }

        function submitComplaintNote(id, e) {
            e.preventDefault();
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            const note = document.getElementById('noteText').value.trim();
            const user = getCurrentUser();
            c.notes.push({ date: nowStr(), author: user.name || user.username, note });
            c.updatedAt = nowStr();
            saveData(data);
            closeModal();
            showToast('Note added!', 'success');
            logActivity(user.id, user.name || user.username, `Added note to complaint ${c.referenceNumber}`);
            switchTab('complaints');
        }

        function scheduleInspection(id) {
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            openModal(`Schedule Inspection for ${c.referenceNumber}`, `
                    <form id="inspectionForm" onsubmit="submitInspection(${id}, event)">
                        <div class="form-group"><label>Date & Time</label>
                            <input type="datetime-local" id="inspectionDate" required />
                        </div>
                        <div class="form-group"><label>Location</label>
                            <input type="text" id="inspectionLocation" required placeholder="e.g. Purok 3, Barangay Gomez" />
                        </div>
                        <div class="form-group"><label>Notes</label>
                            <textarea id="inspectionNotes" required placeholder="Details of the inspection or meeting..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-calendar-plus"></i> Schedule</button>
                    </form>
                `);
        }

        function submitInspection(id, e) {
            e.preventDefault();
            const data = loadData();
            const c = data.complaints.find(x => x.id === id);
            if (!c) return showToast('Complaint not found', 'error');
            const user = getCurrentUser();
            c.inspections.push({
                date: document.getElementById('inspectionDate').value,
                location: document.getElementById('inspectionLocation').value.trim(),
                notes: document.getElementById('inspectionNotes').value.trim()
            });
            c.updatedAt = nowStr();
            // Also add a note
            c.notes.push({
                date: nowStr(),
                author: user.name || user.username,
                note: `Scheduled inspection at ${document.getElementById('inspectionLocation').value.trim()} on ${document.getElementById('inspectionDate').value}`
            });
            saveData(data);
            closeModal();
            showToast('Inspection scheduled!', 'success');
            logActivity(user.id, user.name || user.username, `Scheduled inspection for complaint ${c.referenceNumber}`);
            switchTab('complaints');
        }

        function exportComplaintsReport() {
            const data = loadData();
            if (data.complaints.length === 0) return showToast('No complaints to export', 'warning');
            let csv = 'Reference,Resident,Category,Status,Priority,Created,Resolved\n';
            data.complaints.forEach(c => {
                csv +=
                    `${c.referenceNumber},"${c.residentName}","${c.category}","${c.status}","${c.priority || 'Medium'}","${c.createdAt}","${c.resolvedAt || ''}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints_report_${todayStr()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Report exported!', 'success');
        }

        // ─── RESIDENTS ───
        function renderResidents(role) {
            const container = document.getElementById('appContent');
            const data = loadData();
            const isAdmin = role === 'admin';

            container.innerHTML = `
                    <div class="page-header">
                        <div><h2>Residents</h2><div class="sub">Manage resident records</div></div>
                        ${isAdmin ? `<button class="btn btn-primary" onclick="showAddResidentModal()"><i class="fas fa-plus"></i> Add Resident</button>` : ''}
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Status</th>${isAdmin ? '<th>Actions</th>' : ''}</tr></thead>
                            <tbody>
                                ${data.residents.map((r,i) => `
                                    <tr>
                                        <td>${i+1}</td>
                                        <td><strong>${r.name}</strong></td>
                                        <td>${r.email || '-'}</td>
                                        <td>${r.phone || '-'}</td>
                                        <td>${r.address || '-'}</td>
                                        <td>${getStatusBadge(r.status || 'Active')}</td>
                                        ${isAdmin ? `
                                            <td>
                                                <div class="actions">
                                                    <button class="btn btn-xs btn-warning" onclick="editResident(${r.id})"><i class="fas fa-edit"></i></button>
                                                    <button class="btn btn-xs btn-danger" onclick="deleteResident(${r.id})"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `).join('') || `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty-state"><i class="fas fa-users"></i><p>No residents registered yet.</p></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                `;
        }

        function showAddResidentModal() {
            openModal('Add Resident', `
                    <form id="addResidentForm" onsubmit="saveResident(event)">
                        <div class="form-group"><label>Full Name *</label><input type="text" id="rName" required placeholder="Juan Dela Cruz" /></div>
                        <div class="form-row">
                            <div class="form-group"><label>Email</label><input type="email" id="rEmail" placeholder="juan@email.com" /></div>
                            <div class="form-group"><label>Phone</label><input type="text" id="rPhone" placeholder="09123456789" /></div>
                        </div>
                        <div class="form-group"><label>Address</label><input type="text" id="rAddress" placeholder="Purok, Barangay Gomez" /></div>
                        <div class="form-group"><label>Birthdate</label><input type="date" id="rBirthdate" /></div>
                        <div class="form-group"><label>Status</label>
                            <select id="rStatus"><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Save Resident</button>
                    </form>
                `);
        }

        function saveResident(e) {
            e.preventDefault();
            const data = loadData();
            const id = genId(data, 'resident');
            data.residents.push({
                id,
                name: document.getElementById('rName').value.trim(),
                email: document.getElementById('rEmail').value.trim(),
                phone: document.getElementById('rPhone').value.trim(),
                address: document.getElementById('rAddress').value.trim(),
                birthdate: document.getElementById('rBirthdate').value,
                status: document.getElementById('rStatus').value,
                registeredAt: todayStr()
            });
            saveData(data);
            closeModal();
            showToast('Resident added!', 'success');
            switchTab('residents');
        }

        function editResident(id) {
            const data = loadData();
            const r = data.residents.find(x => x.id === id);
            if (!r) return showToast('Resident not found', 'error');
            openModal('Edit Resident', `
                    <form id="editResidentForm" onsubmit="updateResident(${id}, event)">
                        <div class="form-group"><label>Full Name</label><input type="text" id="eRName" value="${r.name}" required /></div>
                        <div class="form-row">
                            <div class="form-group"><label>Email</label><input type="email" id="eREmail" value="${r.email||''}" /></div>
                            <div class="form-group"><label>Phone</label><input type="text" id="eRPhone" value="${r.phone||''}" /></div>
                        </div>
                        <div class="form-group"><label>Address</label><input type="text" id="eRAddress" value="${r.address||''}" /></div>
                        <div class="form-group"><label>Birthdate</label><input type="date" id="eRBirthdate" value="${r.birthdate||''}" /></div>
                        <div class="form-group"><label>Status</label>
                            <select id="eRStatus"><option value="Active" ${r.status==='Active'?'selected':''}>Active</option><option value="Inactive" ${r.status==='Inactive'?'selected':''}>Inactive</option></select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Update</button>
                    </form>
                `);
        }

        function updateResident(id, e) {
            e.preventDefault();
            const data = loadData();
            const r = data.residents.find(x => x.id === id);
            if (!r) return showToast('Resident not found', 'error');
            r.name = document.getElementById('eRName').value.trim();
            r.email = document.getElementById('eREmail').value.trim();
            r.phone = document.getElementById('eRPhone').value.trim();
            r.address = document.getElementById('eRAddress').value.trim();
            r.birthdate = document.getElementById('eRBirthdate').value;
            r.status = document.getElementById('eRStatus').value;
            saveData(data);
            closeModal();
            showToast('Resident updated!', 'success');
            switchTab('residents');
        }

        function deleteResident(id) {
            if (!confirm('Delete this resident permanently?')) return;
            const data = loadData();
            data.residents = data.residents.filter(r => r.id !== id);
            saveData(data);
            showToast('Resident deleted.', 'info');
            switchTab('residents');
        }

        // ─── STAFF MANAGEMENT (Admin only) ───
        function renderStaff() {
            const container = document.getElementById('appContent');
            const data = loadData();
            const staff = data.users.filter(u => u.role === 'staff' || u.role === 'admin');

            container.innerHTML = `
                    <div class="page-header">
                        <div><h2>Staff Management</h2><div class="sub">Manage barangay staff accounts</div></div>
                        <button class="btn btn-primary" onclick="showAddStaffModal()"><i class="fas fa-plus"></i> Add Staff</button>
                    </div>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>Name</th><th>Username</th><th>Role</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                ${staff.map((u,i) => `
                                    <tr>
                                        <td>${i+1}</td>
                                        <td><strong>${u.name}</strong></td>
                                        <td>${u.username}</td>
                                        <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-info'}">${u.role}</span></td>
                                        <td>${u.email || '-'}</td>
                                        <td>${getStatusBadge(u.status || 'Active')}</td>
                                        <td>
                                            <div class="actions">
                                                <button class="btn btn-xs btn-warning" onclick="editStaff(${u.id})"><i class="fas fa-edit"></i></button>
                                                ${u.role !== 'admin' ? `<button class="btn btn-xs btn-danger" onclick="deleteStaff(${u.id})"><i class="fas fa-trash"></i></button>` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') || `<tr><td colspan="7" class="empty-state"><i class="fas fa-user-tie"></i><p>No staff accounts.</p></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                `;
        }

        function showAddStaffModal() {
            openModal('Add Staff Account', `
                    <form id="addStaffForm" onsubmit="saveStaff(event)">
                        <div class="form-group"><label>Full Name *</label><input type="text" id="sName" required placeholder="Staff Name" /></div>
                        <div class="form-group"><label>Username *</label><input type="text" id="sUsername" required placeholder="Choose username" /></div>
                        <div class="form-group"><label>Password *</label><input type="password" id="sPassword" required placeholder="Min. 6 characters" minlength="6" /></div>
                        <div class="form-group"><label>Email</label><input type="email" id="sEmail" placeholder="staff@barangaygomez.ph" /></div>
                        <div class="form-group"><label>Phone</label><input type="text" id="sPhone" placeholder="09123456789" /></div>
                        <div class="form-group"><label>Role</label>
                            <select id="sRole"><option value="staff">Staff</option><option value="admin">Admin</option></select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-user-plus"></i> Create Staff</button>
                    </form>
                `);
        }

        function saveStaff(e) {
            e.preventDefault();
            const data = loadData();
            const username = document.getElementById('sUsername').value.trim();
            if (data.users.find(u => u.username === username)) {
                showToast('Username already exists!', 'error');
                return;
            }
            const id = genId(data, 'user');
            data.users.push({
                id,
                username,
                password: document.getElementById('sPassword').value.trim(),
                role: document.getElementById('sRole').value,
                name: document.getElementById('sName').value.trim(),
                email: document.getElementById('sEmail').value.trim(),
                phone: document.getElementById('sPhone').value.trim(),
                address: 'Barangay Hall, Gomez',
                birthdate: '',
                status: 'Active',
                createdAt: todayStr()
            });
            saveData(data);
            closeModal();
            showToast('Staff account created!', 'success');
            switchTab('staff');
        }

        function editStaff(id) {
            const data = loadData();
            const u = data.users.find(x => x.id === id);
            if (!u) return showToast('User not found', 'error');
            openModal('Edit Staff', `
                    <form id="editStaffForm" onsubmit="updateStaff(${id}, event)">
                        <div class="form-group"><label>Name</label><input type="text" id="eSName" value="${u.name}" required /></div>
                        <div class="form-group"><label>Email</label><input type="email" id="eSEmail" value="${u.email||''}" /></div>
                        <div class="form-group"><label>Phone</label><input type="text" id="eSPhone" value="${u.phone||''}" /></div>
                        <div class="form-group"><label>Role</label>
                            <select id="eSRole"><option value="staff" ${u.role==='staff'?'selected':''}>Staff</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select>
                        </div>
                        <div class="form-group"><label>Status</label>
                            <select id="eSStatus"><option value="Active" ${u.status==='Active'?'selected':''}>Active</option><option value="Inactive" ${u.status==='Inactive'?'selected':''}>Inactive</option></select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Update</button>
                    </form>
                `);
        }

        function updateStaff(id, e) {
            e.preventDefault();
            const data = loadData();
            const u = data.users.find(x => x.id === id);
            if (!u) return showToast('User not found', 'error');
            u.name = document.getElementById('eSName').value.trim();
            u.email = document.getElementById('eSEmail').value.trim();
            u.phone = document.getElementById('eSPhone').value.trim();
            u.role = document.getElementById('eSRole').value;
            u.status = document.getElementById('eSStatus').value;
            saveData(data);
            closeModal();
            showToast('Staff updated!', 'success');
            switchTab('staff');
        }

        function deleteStaff(id) {
            if (!confirm('Delete this staff account?')) return;
            const data = loadData();
            data.users = data.users.filter(u => u.id !== id);
            saveData(data);
            showToast('Staff deleted.', 'info');
            switchTab('staff');
        }

        // ─── ANNOUNCEMENTS ───
        function renderAnnouncements(role) {
            const container = document.getElementById('appContent');
            const data = loadData();
            const canManage = role === 'admin' || role === 'staff';

            container.innerHTML = `
                    <div class="page-header">
                        <div><h2>Announcements</h2><div class="sub">${canManage ? 'Post and manage barangay announcements' : 'Stay updated with barangay news'}</div></div>
                        ${canManage ? `<button class="btn btn-primary" onclick="showAddAnnouncementModal()"><i class="fas fa-plus"></i> New Announcement</button>` : ''}
                    </div>
                    ${data.announcements.length === 0 ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet.</p></div>' :
                    data.announcements.map(a => `
                        <div class="card" style="margin-bottom:1rem;border-left:4px solid ${a.isPinned ? 'var(--accent)' : 'var(--primary)'};">
                            <div class="flex-between" style="gap:0.5rem;flex-wrap:wrap;">
                                <h3 style="font-size:1.05rem;">${a.isPinned ? '📌 ' : ''}${a.title}</h3>
                                <span style="font-size:0.8rem;color:#6c757d;">${formatDate(a.date)}</span>
                            </div>
                            <p style="margin-top:0.5rem;">${a.content}</p>
                            <div style="margin-top:0.5rem;font-size:0.8rem;color:#6c757d;">Posted by ${a.author || 'Admin'}</div>
                            ${canManage ? `
                                <div style="margin-top:0.8rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
                                    <button class="btn btn-xs btn-warning" onclick="editAnnouncement(${a.id})"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="btn btn-xs btn-danger" onclick="deleteAnnouncement(${a.id})"><i class="fas fa-trash"></i> Delete</button>
                                    <button class="btn btn-xs ${a.isPinned ? 'btn-secondary' : 'btn-accent'}" onclick="togglePinAnnouncement(${a.id})"><i class="fas fa-thumbtack"></i> ${a.isPinned ? 'Unpin' : 'Pin'}</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                `;
        }

        function showAddAnnouncementModal() {
            openModal('New Announcement', `
                    <form id="addAnnouncementForm" onsubmit="saveAnnouncement(event)">
                        <div class="form-group"><label>Title *</label><input type="text" id="aTitle" required placeholder="Announcement title" /></div>
                        <div class="form-group"><label>Content *</label><textarea id="aContent" required placeholder="Write the announcement details..."></textarea></div>
                        <div class="form-group"><label><input type="checkbox" id="aPinned" /> Pin to top</label></div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-bullhorn"></i> Post Announcement</button>
                    </form>
                `);
        }

        function saveAnnouncement(e) {
            e.preventDefault();
            const data = loadData();
            const user = getCurrentUser();
            const id = genId(data, 'announcement');
            data.announcements.push({
                id,
                title: document.getElementById('aTitle').value.trim(),
                content: document.getElementById('aContent').value.trim(),
                date: todayStr(),
                author: user.name || user.username,
                isPinned: document.getElementById('aPinned').checked
            });
            saveData(data);
            closeModal();
            showToast('Announcement posted!', 'success');
            logActivity(user.id, user.name || user.username, 'Posted announcement');
            switchTab('announcements');
        }

        function editAnnouncement(id) {
            const data = loadData();
            const a = data.announcements.find(x => x.id === id);
            if (!a) return showToast('Announcement not found', 'error');
            openModal('Edit Announcement', `
                    <form id="editAnnouncementForm" onsubmit="updateAnnouncement(${id}, event)">
                        <div class="form-group"><label>Title *</label><input type="text" id="eATitle" value="${a.title}" required /></div>
                        <div class="form-group"><label>Content *</label><textarea id="eAContent" required>${a.content}</textarea></div>
                        <div class="form-group"><label><input type="checkbox" id="eAPinned" ${a.isPinned ? 'checked' : ''} /> Pin to top</label></div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Update</button>
                    </form>
                `);
        }

        function updateAnnouncement(id, e) {
            e.preventDefault();
            const data = loadData();
            const a = data.announcements.find(x => x.id === id);
            if (!a) return showToast('Announcement not found', 'error');
            a.title = document.getElementById('eATitle').value.trim();
            a.content = document.getElementById('eAContent').value.trim();
            a.isPinned = document.getElementById('eAPinned').checked;
            saveData(data);
            closeModal();
            showToast('Announcement updated!', 'success');
            switchTab('announcements');
        }

        function deleteAnnouncement(id) {
            if (!confirm('Delete this announcement?')) return;
            const data = loadData();
            data.announcements = data.announcements.filter(a => a.id !== id);
            saveData(data);
            showToast('Announcement deleted.', 'info');
            switchTab('announcements');
        }

        function togglePinAnnouncement(id) {
            const data = loadData();
            const a = data.announcements.find(x => x.id === id);
            if (!a) return showToast('Announcement not found', 'error');
            a.isPinned = !a.isPinned;
            saveData(data);
            showToast(a.isPinned ? 'Pinned!' : 'Unpinned!', 'info');
            switchTab('announcements');
        }

        // ─── ACTIVITY LOGS ───
        function renderActivityLogs() {
            const container = document.getElementById('appContent');
            const data = loadData();
            const logs = data.activityLogs.slice().reverse();

            container.innerHTML = `
                    <div class="page-header"><div><h2>Activity Logs</h2><div class="sub">Audit trail of all system activities</div></div></div>
                    <div class="table-wrap">
                        <table>
                            <thead><tr><th>#</th><th>User</th><th>Action</th><th>Timestamp</th></tr></thead>
                            <tbody>
                                ${logs.map((l,i) => `
                                    <tr>
                                        <td>${i+1}</td>
                                        <td><strong>${l.userName}</strong></td>
                                        <td>${l.action}</td>
                                        <td>${formatDateTime(l.timestamp)}</td>
                                    </tr>
                                `).join('') || `<tr><td colspan="4" class="empty-state"><i class="fas fa-history"></i><p>No activity logs yet.</p></td></tr>`}
                            </tbody>
                        </table>
                    </div>
                `;
        }

        // ─── REPORTS (updated with status distribution pie chart) ───
        function renderReports() {
            const container = document.getElementById('appContent');
            const data = loadData();
            const total = data.complaints.length;
            const resolved = data.complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
            const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
            const pending = data.complaints.filter(c => c.status === 'Pending').length;

            // Category counts
            const cats = {};
            data.complaints.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
            const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]);
            const topCategory = sortedCats.length > 0 ? sortedCats[0][0] : 'None';

            container.innerHTML = `
                    <div class="page-header"><div><h2>Reports & Analytics</h2><div class="sub">Complaint statistics and trends</div></div></div>
                    <div class="stats-grid">
                        <div class="stat-card"><div class="icon"><i class="fas fa-file-alt"></i></div><div class="num">${total}</div><div class="label">Total Complaints</div></div>
                        <div class="stat-card"><div class="icon"><i class="fas fa-check-circle"></i></div><div class="num">${resolved}</div><div class="label">Resolved</div></div>
                        <div class="stat-card"><div class="icon"><i class="fas fa-percent"></i></div><div class="num">${rate}%</div><div class="label">Resolution Rate</div></div>
                        <div class="stat-card"><div class="icon"><i class="fas fa-clock"></i></div><div class="num">${pending}</div><div class="label">Pending</div></div>
                        <div class="stat-card"><div class="icon"><i class="fas fa-tag"></i></div><div class="num">${topCategory}</div><div class="label">Top Category</div></div>
                        <div class="stat-card"><div class="icon"><i class="fas fa-users"></i></div><div class="num">${data.residents.length}</div><div class="label">Total Residents</div></div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
                        <div class="card">
                            <div class="card-header"><span>📊 Complaint Categories</span></div>
                            ${sortedCats.length === 0 ? '<p class="text-muted">No data yet.</p>' :
                            sortedCats.map(([cat, count]) => `
                                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f3f5;">
                                    <span><i class="fas ${getCategoryIcon(cat)}" style="color:var(--primary);"></i> ${cat}</span>
                                    <span><strong>${count}</strong> (${Math.round((count/total)*100)}%)</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="card">
                            <div class="card-header"><span>📈 Status Summary</span></div>
                            ${['Pending','Under Review','Ongoing','Resolved','Closed'].map(s => {
                                const count = data.complaints.filter(c => c.status === s).length;
                                const pct = total > 0 ? Math.round((count/total)*100) : 0;
                                return count > 0 ? `
                                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f3f5;">
                                        <span>${getStatusBadge(s)}</span>
                                        <span><strong>${count}</strong> (${pct}%)</span>
                                    </div>
                                ` : '';
                            }).join('') || '<p class="text-muted">No data yet.</p>'}
                        </div>
                    </div>
                    <div class="mt-2" style="display:flex;gap:0.8rem;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" onclick="exportComplaintsReport()"><i class="fas fa-file-excel"></i> Export CSV</button>
                        <button class="btn btn-sm btn-secondary" onclick="printReport()"><i class="fas fa-print"></i> Print Report</button>
                    </div>

                    <div class="reports-charts-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
                        <!-- Complaint Status Distribution Doughnut Chart -->
                        <div class="chart-container mt-2">
                            <h4 style="margin-bottom:0.8rem;"><i class="fas fa-chart-pie" style="color:var(--primary);"></i> Complaint Status Distribution</h4>
                            <div class="chart-canvas-wrap" style="height:280px;">
                                <canvas id="statusPieChart"></canvas>
                                <div id="statusPieEmpty" class="empty-state" style="display:none;"><i class="fas fa-chart-pie"></i><p>No data to display.</p></div>
                            </div>
                        </div>

                        <!-- Monthly Complaint Trend Chart -->
                        <div class="chart-container mt-2">
                            <h4 style="margin-bottom:0.8rem;"><i class="fas fa-chart-line" style="color:var(--primary);"></i> Monthly Complaint Trend</h4>
                            <div class="chart-canvas-wrap" style="height:280px;">
                                <canvas id="trendChart"></canvas>
                                <div id="trendEmpty" class="empty-state" style="display:none;"><i class="fas fa-chart-line"></i><p>No data available.</p></div>
                            </div>
                        </div>
                    </div>
                `;
            setTimeout(() => {
                drawStatusPieChart();
                drawTrendChart();
            }, 100);
        }

        // ─── Doughnut chart for status distribution (Reports page) ───
        function drawStatusPieChart() {
            const canvas = document.getElementById('statusPieChart');
            const emptyEl = document.getElementById('statusPieEmpty');
            if (!canvas || !window.Chart) return;
            destroyChart('statusPieChart');

            const data = loadData();
            const statuses = ['Pending', 'Under Review', 'Ongoing', 'Resolved', 'Closed'];
            const colors = ['#ffc107', '#17a2b8', '#004085', '#28a745', '#6c757d'];
            const counts = statuses.map(s => data.complaints.filter(c => c.status === s).length);
            const total = counts.reduce((a, b) => a + b, 0);

            if (total === 0) {
                canvas.style.display = 'none';
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }
            canvas.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';

            chartRegistry.statusPieChart = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: statuses,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors,
                        borderColor: '#fff',
                        borderWidth: 3,
                        hoverOffset: 12,
                        borderRadius: 6,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    animation: { animateRotate: true, animateScale: true, duration: 800, easing: 'easeOutQuart' },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 14,
                                font: { size: 11, family: "'Segoe UI', sans-serif" },
                                color: '#1a1a2e',
                                generateLabels: (chart) => {
                                    const ds = chart.data.datasets[0];
                                    return chart.data.labels.map((label, i) => ({
                                        text: `${label} (${ds.data[i]})`,
                                        fillStyle: ds.backgroundColor[i],
                                        strokeStyle: '#fff',
                                        lineWidth: 1,
                                        pointStyle: 'circle',
                                        index: i
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a2e',
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: (ctx) => {
                                    const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                                    return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
                                }
                            }
                        },
                        centerText: { display: true, value: total, label: total === 1 ? 'Complaint' : 'Complaints' }
                    }
                }
            });
        }

        // ─── Monthly trend chart (Reports page) ───
        function drawTrendChart() {
            const canvas = document.getElementById('trendChart');
            const emptyEl = document.getElementById('trendEmpty');
            if (!canvas || !window.Chart) return;
            destroyChart('trendChart');

            const data = loadData();
            const months = {};
            data.complaints.forEach(c => {
                const m = c.createdAt.slice(0, 7);
                months[m] = (months[m] || 0) + 1;
            });
            const sorted = Object.entries(months).sort();

            if (sorted.length === 0) {
                canvas.style.display = 'none';
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }
            canvas.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';

            const monthFmt = (m) => {
                const [y, mo] = m.split('-');
                return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            };
            const labels = sorted.map(([m]) => monthFmt(m));
            const values = sorted.map(([, v]) => v);

            // Running resolved-count overlay so the trend also reads as progress, not just volume
            const resolvedByMonth = sorted.map(([m]) =>
                data.complaints.filter(c => c.createdAt.slice(0, 7) === m && (c.status === 'Resolved' || c.status === 'Closed')).length
            );

            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 260);
            gradient.addColorStop(0, 'rgba(26, 94, 58, 0.35)');
            gradient.addColorStop(1, 'rgba(26, 94, 58, 0.02)');

            chartRegistry.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Complaints Filed',
                            data: values,
                            borderColor: '#1a5e3a',
                            backgroundColor: gradient,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            pointBackgroundColor: '#1a5e3a',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            tension: 0.35,
                            fill: true
                        },
                        {
                            label: 'Resolved / Closed',
                            data: resolvedByMonth,
                            borderColor: '#d4a24e',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 4],
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            pointBackgroundColor: '#d4a24e',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1.5,
                            tension: 0.35,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    animation: { duration: 700, easing: 'easeOutQuart' },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 11, family: "'Segoe UI', sans-serif" },
                                color: '#1a1a2e'
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a2e',
                            padding: 10,
                            cornerRadius: 8,
                            usePointStyle: true
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#6c757d', font: { size: 10 } }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#6c757d', font: { size: 10 }, precision: 0 },
                            grid: { color: '#f1f3f5' }
                        }
                    }
                }
            });
        }

        function printReport() {
            window.print();
        }

        // ─── SETTINGS (Admin only) ───
        function renderSettings() {
            const container = document.getElementById('appContent');
            const data = loadData();
            const s = data.settings || {};

            container.innerHTML = `
                    <div class="page-header"><div><h2>System Settings</h2><div class="sub">Configure system parameters</div></div></div>
                    <div class="card" style="max-width:700px;">
                        <form id="settingsForm" onsubmit="saveSettings(event)">
                            <div class="form-group"><label>System Name</label><input type="text" id="setSystemName" value="${s.systemName || 'Barangay Gomez Complaint System'}" /></div>
                            <div class="form-group"><label>Barangay Name</label><input type="text" id="setBarangay" value="${s.barangayName || 'Barangay Gomez'}" /></div>
                            <div class="form-group"><label>Municipality</label><input type="text" id="setMunicipality" value="${s.municipality || 'San Isidro'}" /></div>
                            <div class="form-group"><label>Province</label><input type="text" id="setProvince" value="${s.province || 'Isabela'}" /></div>
                            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Settings</button>
                        </form>
                        <hr class="mt-2" />
                        <div class="mt-2">
                            <button class="btn btn-danger" onclick="resetSystem()"><i class="fas fa-trash"></i> Reset All Data</button>
                            <span style="font-size:0.8rem;color:#6c757d;margin-left:1rem;">This will delete all data and restore defaults.</span>
                        </div>
                    </div>
                `;
        }

        function saveSettings(e) {
            e.preventDefault();
            const data = loadData();
            data.settings = {
                systemName: document.getElementById('setSystemName').value.trim(),
                barangayName: document.getElementById('setBarangay').value.trim(),
                municipality: document.getElementById('setMunicipality').value.trim(),
                province: document.getElementById('setProvince').value.trim(),
            };
            saveData(data);
            showToast('Settings saved!', 'success');
        }

        function resetSystem() {
            if (!confirm('⚠️ WARNING: This will delete ALL data. Are you sure?')) return;
            if (!confirm('Final confirmation: Reset all data?')) return;
            fetch(`${API_BASE}/data/reset`, { method: 'POST' })
                .then(res => {
                    if (!res.ok) throw new Error('Server responded with ' + res.status);
                    showToast('System reset. Page will reload.', 'warning');
                    setTimeout(() => location.reload(), 1500);
                })
                .catch(err => {
                    console.error('Reset failed:', err);
                    showToast('⚠️ Could not reset the database. Check that the server is running.', 'error');
                });
        }

        // ─── RESIDENT PROFILE ───
        function renderProfile() {
            const container = document.getElementById('appContent');
            const user = getCurrentUser();
            const data = loadData();
            const resident = data.residents.find(r => r.id === user.id) || {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                birthdate: user.birthdate,
                status: 'Active'
            };

            container.innerHTML = `
                    <div class="page-header"><div><h2>My Profile</h2><div class="sub">Your personal information</div></div></div>
                    <div class="card" style="max-width:600px;">
                        <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.2rem;">
                            <div style="font-size:3.5rem;color:var(--primary);"><i class="fas fa-user-circle"></i></div>
                            <div><h3 style="font-size:1.4rem;">${resident.name}</h3><span class="badge badge-success">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></div>
                        </div>
                        <div style="display:grid;gap:0.6rem;">
                            <div><strong>Username:</strong> ${user.username}</div>
                            <div><strong>Email:</strong> ${resident.email || user.email || 'Not set'}</div>
                            <div><strong>Phone:</strong> ${resident.phone || user.phone || 'Not set'}</div>
                            <div><strong>Address:</strong> ${resident.address || user.address || 'Not set'}</div>
                            <div><strong>Birthdate:</strong> ${resident.birthdate ? formatDate(resident.birthdate) : 'Not set'}</div>
                            <div><strong>Status:</strong> ${getStatusBadge(resident.status || 'Active')}</div>
                            <div><strong>Registered:</strong> ${resident.registeredAt ? formatDate(resident.registeredAt) : 'N/A'}</div>
                        </div>
                        <button class="btn btn-primary mt-2" onclick="editResidentProfile()"><i class="fas fa-edit"></i> Edit Profile</button>
                    </div>
                `;
        }

        function editResidentProfile() {
            const user = getCurrentUser();
            const data = loadData();
            const resident = data.residents.find(r => r.id === user.id) || {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                birthdate: user.birthdate,
                status: 'Active'
            };

            openModal('Edit Profile', `
                    <form id="editProfileForm" onsubmit="updateResidentProfile(event)">
                        <div class="form-group"><label>Full Name</label><input type="text" id="epName" value="${resident.name}" required /></div>
                        <div class="form-group"><label>Email</label><input type="email" id="epEmail" value="${resident.email||''}" /></div>
                        <div class="form-group"><label>Phone</label><input type="text" id="epPhone" value="${resident.phone||''}" /></div>
                        <div class="form-group"><label>Address</label><input type="text" id="epAddress" value="${resident.address||''}" /></div>
                        <div class="form-group"><label>Birthdate</label><input type="date" id="epBirthdate" value="${resident.birthdate||''}" /></div>
                        <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-save"></i> Save Changes</button>
                    </form>
                `);
        }

        function updateResidentProfile(e) {
            e.preventDefault();
            const user = getCurrentUser();
            const data = loadData();
            let resident = data.residents.find(r => r.id === user.id);
            if (!resident) {
                // create resident if doesn't exist
                const id = genId(data, 'resident');
                resident = { id, name: user.name, email: user.email, phone: user.phone, address: user.address,
                    birthdate: user.birthdate, status: 'Active', registeredAt: todayStr() };
                data.residents.push(resident);
            }
            resident.name = document.getElementById('epName').value.trim();
            resident.email = document.getElementById('epEmail').value.trim();
            resident.phone = document.getElementById('epPhone').value.trim();
            resident.address = document.getElementById('epAddress').value.trim();
            resident.birthdate = document.getElementById('epBirthdate').value;
            // also update user
            const u = data.users.find(x => x.id === user.id);
            if (u) {
                u.name = resident.name;
                u.email = resident.email;
                u.phone = resident.phone;
                u.address = resident.address;
                u.birthdate = resident.birthdate;
                setCurrentUser(u);
            }
            saveData(data);
            closeModal();
            document.getElementById('sidebarUserName').textContent = resident.name;
            showToast('Profile updated!', 'success');
            switchTab('profile');
        }

        // ─── MY COMPLAINTS (Resident) ───
        function renderMyComplaints() {
            const container = document.getElementById('appContent');
            const user = getCurrentUser();
            const data = loadData();
            const myComplaints = data.complaints.filter(c => c.residentId === user.id || c.residentName === user.name);

            container.innerHTML = `
                    <div class="page-header">
                        <div><h2>My Complaints</h2><div class="sub">Track your submitted complaints</div></div>
                        <button class="btn btn-primary" onclick="switchTab('new-complaint')"><i class="fas fa-plus"></i> New Complaint</button>
                    </div>
                    ${myComplaints.length === 0 ? '<div class="empty-state"><i class="fas fa-check-circle"></i><p>You have not submitted any complaints yet.</p></div>' :
                    myComplaints.map(c => `
                        <div class="card" style="margin-bottom:1rem;border-left:4px solid ${c.status === 'Resolved' || c.status === 'Closed' ? 'var(--success)' : c.status === 'Pending' ? 'var(--warning)' : 'var(--info)'};">
                            <div class="flex-between" style="gap:0.5rem;flex-wrap:wrap;">
                                <div><span class="reference-tag">${c.referenceNumber}</span> <strong>${c.category}</strong></div>
                                ${getStatusBadge(c.status)}
                            </div>
                            <p style="margin-top:0.5rem;">${c.description}</p>
                            <div style="font-size:0.8rem;color:#6c757d;display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.3rem;">
                                <span><i class="far fa-calendar-alt"></i> ${formatDate(c.createdAt)}</span>
                                <span><i class="fas fa-flag"></i> ${getPriorityBadge(c.priority || 'Medium')}</span>
                            </div>
                            ${c.notes && c.notes.length > 0 ? `
                                <div style="margin-top:0.5rem;padding:0.5rem;background:#f8f9fa;border-radius:6px;">
                                    <strong>Latest update:</strong> ${c.notes[c.notes.length-1].note}
                                    <div style="font-size:0.7rem;color:#6c757d;">${c.notes[c.notes.length-1].author} · ${formatDateTime(c.notes[c.notes.length-1].date)}</div>
                                </div>
                            ` : ''}
                            <button class="btn btn-xs btn-primary mt-1" onclick="viewComplaint(${c.id})"><i class="fas fa-eye"></i> View Details</button>
                        </div>
                    `).join('')}
                `;
        }

        // ─── NEW COMPLAINT (Resident) ───
        function renderNewComplaint() {
            const container = document.getElementById('appContent');
            const categories = getComplaintCategories();

            container.innerHTML = `
                    <div class="page-header"><div><h2>Submit a Complaint</h2><div class="sub">Let us know about your concern</div></div></div>
                    <div class="card" style="max-width:700px;">
                        <form id="residentComplaintForm" onsubmit="submitResidentComplaint(event)">
                            <div class="form-group"><label>Complaint Category *</label>
                                <select id="rcCategory" required>
                                    <option value="">Select category...</option>
                                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group"><label>Description *</label>
                                <textarea id="rcDescription" required placeholder="Please describe your complaint in detail..."></textarea>
                            </div>
                            <div class="form-group"><label>Upload Evidence (Photo/Document)</label>
                                <input type="file" id="rcEvidence" accept="image/*,.pdf,.doc,.docx" multiple />
                                <div style="font-size:0.8rem;color:#6c757d;margin-top:4px;">You can upload multiple files (images, PDF, DOC)</div>
                            </div>
                            <div id="evidencePreview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>
                            <button type="submit" class="btn btn-primary btn-block"><i class="fas fa-paper-plane"></i> Submit Complaint</button>
                        </form>
                    </div>
                `;

            // Preview evidence
            document.getElementById('rcEvidence').addEventListener('change', function(e) {
                const preview = document.getElementById('evidencePreview');
                preview.innerHTML = '';
                Array.from(this.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const img = document.createElement('img');
                        img.src = ev.target.result;
                        img.className = 'evidence-thumb';
                        img.style.width = '60px';
                        img.style.height = '60px';
                        img.title = file.name;
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            });
        }

        function submitResidentComplaint(e) {
            e.preventDefault();
            const data = loadData();
            const user = getCurrentUser();
            const resident = data.residents.find(r => r.id === user.id) || data.residents.find(r => r.name === user.name) || {
                id: user.id,
                name: user.name
            };

            const category = document.getElementById('rcCategory').value;
            const description = document.getElementById('rcDescription').value.trim();
            const files = document.getElementById('rcEvidence').files;

            const id = genId(data, 'complaint');
            const ref = generateReferenceNumber();

            const evidence = [];
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    evidence.push({ name: file.name, type: file.type, dataURL: ev.target.result });
                    if (evidence.length === files.length) {
                        // all loaded
                    }
                };
                reader.readAsDataURL(file);
            });

            // Create complaint (with or without evidence)
            const complaint = {
                id,
                referenceNumber: ref,
                residentId: resident.id || user.id,
                residentName: resident.name || user.name,
                category,
                description,
                status: 'Pending',
                priority: 'Medium',
                assignedTo: null,
                notes: [{ date: nowStr(), author: 'System', note: 'Complaint submitted.' }],
                evidence: [],
                inspections: [],
                createdAt: todayStr(),
                updatedAt: todayStr(),
                resolvedAt: null
            };

            // If no files, save immediately; if files, save after loading
            if (files.length === 0) {
                data.complaints.push(complaint);
                saveData(data);
                logActivity(user.id, user.name || user.username, `Submitted complaint ${ref}`);
                showToast(`Complaint submitted! Reference: ${ref}`, 'success');
                document.getElementById('residentComplaintForm').reset();
                document.getElementById('evidencePreview').innerHTML = '';
                switchTab('my-complaints');
            } else {
                // Handle file loading
                let loaded = 0;
                Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        complaint.evidence.push({ name: file.name, type: file.type, dataURL: ev.target
                            .result });
                        loaded++;
                        if (loaded === files.length) {
                            data.complaints.push(complaint);
                            saveData(data);
                            logActivity(user.id, user.name || user.username, `Submitted complaint ${ref}`);
                            showToast(`Complaint submitted with evidence! Reference: ${ref}`, 'success');
                            document.getElementById('residentComplaintForm').reset();
                            document.getElementById('evidencePreview').innerHTML = '';
                            switchTab('my-complaints');
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }

            // If no files, the above will handle it. But if files exist, the async flow handles it.
            // For the case of no files, we already handled above.
        }

        // ─── VISITOR ───
        function renderVisitorAnnouncements() {
            const data = loadData();
            const container = document.getElementById('visitorContent');
            container.innerHTML = `
                    ${data.announcements.length === 0 ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements available at this time.</p></div>' :
                    data.announcements.map(a => `
                        <div class="card" style="margin-bottom:1.2rem;border-left:4px solid ${a.isPinned ? 'var(--accent)' : 'var(--primary)'};">
                            <div class="flex-between" style="gap:0.5rem;flex-wrap:wrap;">
                                <h3 style="font-size:1.1rem;">${a.isPinned ? '📌 ' : ''}${a.title}</h3>
                                <span style="font-size:0.8rem;color:#6c757d;">${formatDate(a.date)}</span>
                            </div>
                            <p style="margin-top:0.5rem;line-height:1.6;">${a.content}</p>
                            <div style="margin-top:0.5rem;font-size:0.8rem;color:#6c757d;">Posted by ${a.author || 'Admin'}</div>
                        </div>
                    `).join('')}
                `;
        }

        // ─── INIT ───
        async function initApp() {
            try {
                _cache = await fetchDataFromServer();
                _dbReady = true;
            } catch (err) {
                console.error('Could not load data from the server:', err);
                showBootError();
                return;
            }
            hideBootScreen();
            const currentUser = getCurrentUser();
            if (currentUser) {
                showApp();
            } else {
                showLanding();
            }
        }

        function hideBootScreen() {
            const el = document.getElementById('bootScreen');
            if (el) el.classList.add('hidden');
        }

        function showBootError() {
            const el = document.getElementById('bootScreen');
            if (!el) return;
            el.innerHTML = `
                <div style="text-align:center;color:#fff;max-width:420px;padding:0 1.5rem;">
                    <i class="fas fa-triangle-exclamation" style="font-size:2.2rem;color:#ffc107;margin-bottom:1rem;"></i>
                    <h2 style="margin-bottom:0.6rem;">Can't reach the database</h2>
                    <p style="opacity:0.85;line-height:1.6;">
                        The app couldn't connect to the backend server at <code>${API_BASE}/data</code>.
                        Make sure the server is running (<code>npm start</code> inside the <code>server</code> folder),
                        then reload this page.
                    </p>
                    <button class="btn btn-primary mt-2" onclick="location.reload()">
                        <i class="fas fa-rotate"></i> Retry
                    </button>
                </div>
            `;
        }

        initApp();

        // ─── roundRect polyfill for canvas ───
        if (!CanvasRenderingContext2D.prototype.roundRect) {
            CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
                if (r > w / 2) r = w / 2;
                if (r > h / 2) r = h / 2;
                this.moveTo(x + r, y);
                this.lineTo(x + w - r, y);
                this.quadraticCurveTo(x + w, y, x + w, y + r);
                this.lineTo(x + w, y + h - r);
                this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                this.lineTo(x + r, y + h);
                this.quadraticCurveTo(x, y + h, x, y + h - r);
                this.lineTo(x, y + r);
                this.quadraticCurveTo(x, y, x + r, y);
                this.closePath();
                return this;
            };
        }

        console.log('🏡 Barangay Gomez Complaint & Concern Management System');
        console.log('👤 Admin: admin / admin123');
        console.log('👤 Staff: staff1 / staff123');
        console.log('👤 Staff: staff2 / staff123');
        console.log('🗄️  Data stored in a real SQLite database via the backend API.');