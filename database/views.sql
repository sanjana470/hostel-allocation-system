USE hostel_db;

-- 1. Rooms that still have free beds
CREATE OR REPLACE VIEW vw_vacant_rooms AS
SELECT h.hostel_name, h.type AS hostel_type, r.room_id, r.room_number, r.floor,
       r.capacity, r.occupied_count,
       (r.capacity - r.occupied_count) AS vacancies,
       r.fee_per_semester
FROM Room r
JOIN Hostel h ON r.hostel_id = h.hostel_id
WHERE r.status = 'Available' AND r.occupied_count < r.capacity;

-- 2. Occupancy summary per hostel
CREATE OR REPLACE VIEW vw_hostel_occupancy AS
SELECT h.hostel_id, h.hostel_name, h.type AS hostel_type,
       COUNT(r.room_id)                       AS total_rooms,
       COALESCE(SUM(r.capacity), 0)           AS total_beds,
       COALESCE(SUM(r.occupied_count), 0)     AS occupied_beds,
       COALESCE(SUM(r.capacity - r.occupied_count), 0) AS vacant_beds,
       ROUND(COALESCE(SUM(r.occupied_count), 0) * 100.0
             / NULLIF(SUM(r.capacity), 0), 1) AS occupancy_percent
FROM Hostel h
LEFT JOIN Room r ON h.hostel_id = r.hostel_id
GROUP BY h.hostel_id, h.hostel_name, h.type;

-- 3. Who is staying where right now
CREATE OR REPLACE VIEW vw_active_allocations AS
SELECT a.allocation_id, s.student_id, s.name AS student_name, s.course,
       h.hostel_name, r.room_number, r.floor, a.allocation_date
FROM Allocation a
JOIN Student s ON a.student_id = s.student_id
JOIN Room r    ON a.room_id = r.room_id
JOIN Hostel h  ON r.hostel_id = h.hostel_id
WHERE a.status = 'Active';