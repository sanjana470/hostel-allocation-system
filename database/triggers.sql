USE hostel_db;

DROP TRIGGER IF EXISTS trg_before_allocation_insert;
DROP TRIGGER IF EXISTS trg_after_allocation_insert;
DROP TRIGGER IF EXISTS trg_after_allocation_update;

DELIMITER //

-- 1. Before allocating: check gender match, capacity, and room status
CREATE TRIGGER trg_before_allocation_insert
BEFORE INSERT ON Allocation
FOR EACH ROW
BEGIN
    DECLARE v_gender CHAR(1);
    DECLARE v_hostel_type VARCHAR(10);
    DECLARE v_capacity INT;
    DECLARE v_occupied INT;
    DECLARE v_status VARCHAR(15);

    SELECT gender INTO v_gender FROM Student WHERE student_id = NEW.student_id;

    SELECT h.type, r.capacity, r.occupied_count, r.status
      INTO v_hostel_type, v_capacity, v_occupied, v_status
      FROM Room r JOIN Hostel h ON r.hostel_id = h.hostel_id
     WHERE r.room_id = NEW.room_id
     FOR UPDATE;

    IF v_status = 'Maintenance' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is under maintenance';
    END IF;

    IF (v_gender = 'M' AND v_hostel_type <> 'Boys')
       OR (v_gender = 'F' AND v_hostel_type <> 'Girls') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student gender does not match hostel type';
    END IF;

    IF v_occupied >= v_capacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is already full';
    END IF;
END//

-- 2. After allocating: increase occupancy, mark Full if needed
CREATE TRIGGER trg_after_allocation_insert
AFTER INSERT ON Allocation
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE Room
           SET occupied_count = occupied_count + 1,
               status = IF(occupied_count + 1 >= capacity, 'Full', 'Available')
         WHERE room_id = NEW.room_id;
    END IF;
END//

-- 3. After vacating: decrease occupancy, mark Available again
CREATE TRIGGER trg_after_allocation_update
AFTER UPDATE ON Allocation
FOR EACH ROW
BEGIN
    IF OLD.status = 'Active' AND NEW.status = 'Vacated' THEN
        UPDATE Room
           SET occupied_count = occupied_count - 1,
               status = 'Available'
         WHERE room_id = NEW.room_id;
    END IF;
END//

DELIMITER ;