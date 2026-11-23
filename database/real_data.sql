USE hostel_db;

INSERT INTO Warden (name, phone, email) VALUES
('Your Warden Name', '9XXXXXXXXX', 'warden@college.edu');

INSERT INTO Hostel (hostel_name, type, total_floors, warden_id) VALUES
('Your Boys Hostel', 'Boys', 3, 1);

INSERT INTO Room (hostel_id, room_number, floor, capacity, fee_per_semester) VALUES
(1, '101', 1, 2, 25000),
(1, '102', 1, 3, 20000),
(1, '201', 2, 2, 25000);