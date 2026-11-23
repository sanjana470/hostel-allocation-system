Table Student {
  student_id int [pk]
  name varchar
  gender varchar
  dob date
  phone varchar
  email varchar
  course varchar
  year int
  address varchar
  guardian_name varchar
  guardian_phone varchar
}

Table Warden {
  warden_id int [pk]
  name varchar
  phone varchar
  email varchar
}

Table Hostel {
  hostel_id int [pk]
  hostel_name varchar
  type varchar
  total_floors int
  warden_id int [ref: > Warden.warden_id]
}

Table Room {
  room_id int [pk]
  hostel_id int [ref: > Hostel.hostel_id]
  room_number varchar
  floor int
  capacity int
  occupied_count int
  fee_per_semester decimal
  status varchar
}

Table Allocation {
  allocation_id int [pk]
  student_id int [ref: > Student.student_id]
  room_id int [ref: > Room.room_id]
  allocation_date date
  checkout_date date
  status varchar
}

Table Payment {
  payment_id int [pk]
  allocation_id int [ref: > Allocation.allocation_id]
  amount decimal
  payment_date date
  payment_mode varchar
  semester varchar
  status varchar
}

Table Users {
  user_id int [pk]
  username varchar
  password_hash varchar
  role varchar
  student_id int [ref: > Student.student_id]
  warden_id int [ref: > Warden.warden_id]
}