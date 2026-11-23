DROP DATABASE IF EXISTS hostel_db;
CREATE DATABASE hostel_db;
USE hostel_db;

-- 1. Student
CREATE TABLE Student (
    student_id      INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    gender          CHAR(1) NOT NULL,
    dob             DATE NOT NULL,
    phone           VARCHAR(15) NOT NULL UNIQUE,
    email           VARCHAR(100) NOT NULL UNIQUE,
    course          VARCHAR(50) NOT NULL,
    year            INT NOT NULL,
    address         VARCHAR(255),
    guardian_name   VARCHAR(100),
    guardian_phone  VARCHAR(15),
    CONSTRAINT chk_student_gender CHECK (gender IN ('M','F')),
    CONSTRAINT chk_student_year   CHECK (year BETWEEN 1 AND 5)
);

-- 2. Warden
CREATE TABLE Warden (
    warden_id  INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    phone      VARCHAR(15) NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Hostel
CREATE TABLE Hostel (
    hostel_id     INT AUTO_INCREMENT PRIMARY KEY,
    hostel_name   VARCHAR(100) NOT NULL UNIQUE,
    type          VARCHAR(10) NOT NULL,
    total_floors  INT NOT NULL,
    warden_id     INT NOT NULL,
    CONSTRAINT chk_hostel_type   CHECK (type IN ('Boys','Girls')),
    CONSTRAINT chk_hostel_floors CHECK (total_floors > 0),
    CONSTRAINT fk_hostel_warden  FOREIGN KEY (warden_id)
        REFERENCES Warden(warden_id)
);

-- 4. Room
CREATE TABLE Room (
    room_id           INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id         INT NOT NULL,
    room_number       VARCHAR(10) NOT NULL,
    floor             INT NOT NULL,
    capacity          INT NOT NULL,
    occupied_count    INT NOT NULL DEFAULT 0,
    fee_per_semester  DECIMAL(10,2) NOT NULL,
    status            VARCHAR(15) NOT NULL DEFAULT 'Available',
    CONSTRAINT uq_room UNIQUE (hostel_id, room_number),
    CONSTRAINT chk_room_capacity  CHECK (capacity BETWEEN 1 AND 6),
    CONSTRAINT chk_room_occupied  CHECK (occupied_count >= 0 AND occupied_count <= capacity),
    CONSTRAINT chk_room_fee       CHECK (fee_per_semester >= 0),
    CONSTRAINT chk_room_status    CHECK (status IN ('Available','Full','Maintenance')),
    CONSTRAINT fk_room_hostel FOREIGN KEY (hostel_id)
        REFERENCES Hostel(hostel_id)
);

-- 5. Allocation
CREATE TABLE Allocation (
    allocation_id    INT AUTO_INCREMENT PRIMARY KEY,
    student_id       INT NOT NULL,
    room_id          INT NOT NULL,
    allocation_date  DATE NOT NULL,
    checkout_date    DATE NULL,
    status           VARCHAR(10) NOT NULL DEFAULT 'Active',
    -- Trick: equals student_id only while Active, otherwise NULL.
    -- UNIQUE on it means one Active allocation per student.
    active_student_id INT GENERATED ALWAYS AS
        (CASE WHEN status = 'Active' THEN student_id ELSE NULL END) STORED,
    CONSTRAINT uq_one_active_room UNIQUE (active_student_id),
    CONSTRAINT chk_alloc_status CHECK (status IN ('Active','Vacated')),
    CONSTRAINT chk_alloc_dates  CHECK (checkout_date IS NULL OR checkout_date >= allocation_date),
    CONSTRAINT fk_alloc_student FOREIGN KEY (student_id)
        REFERENCES Student(student_id),
    CONSTRAINT fk_alloc_room FOREIGN KEY (room_id)
        REFERENCES Room(room_id)
);

-- 6. Payment
CREATE TABLE Payment (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    allocation_id  INT NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    payment_date   DATE NOT NULL,
    payment_mode   VARCHAR(10) NOT NULL,
    semester       VARCHAR(20) NOT NULL,
    status         VARCHAR(10) NOT NULL DEFAULT 'Pending',
    CONSTRAINT chk_pay_amount CHECK (amount > 0),
    CONSTRAINT chk_pay_mode   CHECK (payment_mode IN ('Cash','UPI','Card')),
    CONSTRAINT chk_pay_status CHECK (status IN ('Paid','Pending')),
    CONSTRAINT fk_pay_alloc FOREIGN KEY (allocation_id)
        REFERENCES Allocation(allocation_id)
);

-- 7. Users (login)
CREATE TABLE Users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(10) NOT NULL,
    student_id     INT NULL,
    warden_id      INT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('Admin','Warden','Student')),
    CONSTRAINT fk_user_student FOREIGN KEY (student_id)
        REFERENCES Student(student_id),
    CONSTRAINT fk_user_warden FOREIGN KEY (warden_id)
        REFERENCES Warden(warden_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_room_hostel   ON Room(hostel_id);
CREATE INDEX idx_alloc_room    ON Allocation(room_id);
CREATE INDEX idx_pay_alloc     ON Payment(allocation_id);