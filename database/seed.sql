USE hostel_db;

-- Wardens
INSERT INTO Warden (name, phone, email) VALUES
('Ramesh Kumar',  '9876500001', 'ramesh.kumar@college.edu'),
('Sunita Sharma', '9876500002', 'sunita.sharma@college.edu'),
('Anil Verma',    '9876500003', 'anil.verma@college.edu');

-- Hostels
INSERT INTO Hostel (hostel_name, type, total_floors, warden_id) VALUES
('Aryabhatta Boys Hostel', 'Boys',  3, 1),
('Kalpana Girls Hostel',   'Girls', 3, 2),
('Vivekananda Boys Hostel','Boys',  2, 3);

-- Rooms (occupied_count stays 0 for now; allocations will update it later)
INSERT INTO Room (hostel_id, room_number, floor, capacity, fee_per_semester) VALUES
(1, '101', 1, 2, 25000.00),
(1, '102', 1, 3, 20000.00),
(1, '201', 2, 2, 25000.00),
(1, '202', 2, 3, 20000.00),
(2, '101', 1, 2, 27000.00),
(2, '102', 1, 3, 22000.00),
(2, '201', 2, 2, 27000.00),
(2, '202', 2, 4, 18000.00),
(3, '101', 1, 2, 24000.00),
(3, '102', 1, 3, 19000.00);

-- Students
INSERT INTO Student (name, gender, dob, phone, email, course, year, address, guardian_name, guardian_phone) VALUES
('Rahul Singh',   'M', '2005-03-12', '9000000001', 'rahul.singh@mail.com',   'B.Tech CSE', 1, 'Patna, Bihar',     'Vijay Singh',   '9100000001'),
('Amit Patel',    'M', '2004-07-25', '9000000002', 'amit.patel@mail.com',    'B.Tech ECE', 2, 'Surat, Gujarat',   'Mahesh Patel',  '9100000002'),
('Priya Nair',    'F', '2005-01-18', '9000000003', 'priya.nair@mail.com',    'B.Tech CSE', 1, 'Kochi, Kerala',    'Suresh Nair',   '9100000003'),
('Sneha Reddy',   'F', '2003-11-05', '9000000004', 'sneha.reddy@mail.com',   'MBA',        2, 'Hyderabad, TS',    'Ravi Reddy',    '9100000004'),
('Karan Mehta',   'M', '2004-09-30', '9000000005', 'karan.mehta@mail.com',   'B.Sc Physics',2,'Jaipur, Rajasthan','Dinesh Mehta',  '9100000005'),
('Ananya Das',    'F', '2005-05-22', '9000000006', 'ananya.das@mail.com',    'B.Tech IT',  1, 'Kolkata, WB',      'Sourav Das',    '9100000006'),
('Vikram Joshi',  'M', '2003-12-02', '9000000007', 'vikram.joshi@mail.com',  'B.Tech ME',  3, 'Pune, Maharashtra','Prakash Joshi', '9100000007'),
('Meera Iyer',    'F', '2004-04-14', '9000000008', 'meera.iyer@mail.com',    'BBA',        2, 'Chennai, TN',      'Krishnan Iyer', '9100000008');

-- Users (password hashes are placeholders; the backend will create real bcrypt hashes later)
INSERT INTO Users (username, password_hash, role, student_id, warden_id) VALUES
('admin',    'placeholder_hash', 'Admin',   NULL, NULL),
('ramesh',   'placeholder_hash', 'Warden',  NULL, 1),
('sunita',   'placeholder_hash', 'Warden',  NULL, 2),
('rahul',    'placeholder_hash', 'Student', 1,    NULL),
('priya',    'placeholder_hash', 'Student', 3,    NULL);