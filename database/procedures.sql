USE hostel_db;

DROP PROCEDURE IF EXISTS allocate_room;
DROP PROCEDURE IF EXISTS deallocate_room;

DELIMITER //

-- Allocate a room to a student (triggers enforce gender, capacity, maintenance)
CREATE PROCEDURE allocate_room(IN p_student_id INT, IN p_room_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        INSERT INTO Allocation (student_id, room_id, allocation_date)
        VALUES (p_student_id, p_room_id, CURDATE());
    COMMIT;

    SELECT 'Room allocated successfully' AS message;
END//

-- Vacate the student's current active room
CREATE PROCEDURE deallocate_room(IN p_student_id INT)
BEGIN
    DECLARE v_alloc_id INT DEFAULT NULL;

    SELECT allocation_id INTO v_alloc_id
      FROM Allocation
     WHERE student_id = p_student_id AND status = 'Active'
     LIMIT 1;

    IF v_alloc_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student has no active allocation';
    END IF;

    UPDATE Allocation
       SET status = 'Vacated', checkout_date = CURDATE()
     WHERE allocation_id = v_alloc_id;

    SELECT 'Room vacated successfully' AS message;
END//

DELIMITER ;