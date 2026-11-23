USE hostel_db;

-- 1. INNER JOIN: students with their current hostel and room
SELECT s.name, s.course, h.hostel_name, r.room_number
FROM Allocation a
JOIN Student s ON a.student_id = s.student_id
JOIN Room r    ON a.room_id = r.room_id
JOIN Hostel h  ON r.hostel_id = h.hostel_id
WHERE a.status = 'Active';

-- 2. LEFT JOIN: students who have NEVER been allocated a room
SELECT s.student_id, s.name
FROM Student s
LEFT JOIN Allocation a ON s.student_id = a.student_id
WHERE a.allocation_id IS NULL;

-- 3. GROUP BY + COUNT: number of active residents per hostel
SELECT h.hostel_name, COUNT(*) AS residents
FROM Allocation a
JOIN Room r   ON a.room_id = r.room_id
JOIN Hostel h ON r.hostel_id = h.hostel_id
WHERE a.status = 'Active'
GROUP BY h.hostel_name;

-- 4. HAVING: hostels with more than 1 resident
SELECT h.hostel_name, COUNT(*) AS residents
FROM Allocation a
JOIN Room r   ON a.room_id = r.room_id
JOIN Hostel h ON r.hostel_id = h.hostel_id
WHERE a.status = 'Active'
GROUP BY h.hostel_name
HAVING COUNT(*) > 1;

-- 5. Subquery: rooms with more vacancies than the average vacancy
SELECT room_id, room_number, (capacity - occupied_count) AS vacancies
FROM Room
WHERE (capacity - occupied_count) >
      (SELECT AVG(capacity - occupied_count) FROM Room);

-- 6. Subquery with IN: students currently staying in Girls hostels
SELECT name FROM Student
WHERE student_id IN (
    SELECT a.student_id
    FROM Allocation a
    JOIN Room r   ON a.room_id = r.room_id
    JOIN Hostel h ON r.hostel_id = h.hostel_id
    WHERE a.status = 'Active' AND h.type = 'Girls'
);

-- 7. Aggregate: total fees collected per hostel (works after Payment rows exist)
SELECT h.hostel_name, SUM(p.amount) AS total_collected
FROM Payment p
JOIN Allocation a ON p.allocation_id = a.allocation_id
JOIN Room r       ON a.room_id = r.room_id
JOIN Hostel h     ON r.hostel_id = h.hostel_id
WHERE p.status = 'Paid'
GROUP BY h.hostel_name;

-- 8. Pending payments: active residents with no 'Paid' payment
SELECT s.name, h.hostel_name, r.room_number
FROM Allocation a
JOIN Student s ON a.student_id = s.student_id
JOIN Room r    ON a.room_id = r.room_id
JOIN Hostel h  ON r.hostel_id = h.hostel_id
WHERE a.status = 'Active'
  AND NOT EXISTS (
      SELECT 1 FROM Payment p
      WHERE p.allocation_id = a.allocation_id AND p.status = 'Paid'
  );

-- 9. Allocation history of one student (change the id to test)
SELECT s.name, h.hostel_name, r.room_number,
       a.allocation_date, a.checkout_date, a.status
FROM Allocation a
JOIN Student s ON a.student_id = s.student_id
JOIN Room r    ON a.room_id = r.room_id
JOIN Hostel h  ON r.hostel_id = h.hostel_id
WHERE s.student_id = 1
ORDER BY a.allocation_date;