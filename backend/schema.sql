-- =========================================================
-- 1. DROP EXISTING SCHEMA
-- =========================================================
DROP TABLE IF EXISTS AdminAction CASCADE;
DROP TABLE IF EXISTS History CASCADE;
DROP TABLE IF EXISTS Notification CASCADE;
DROP TABLE IF EXISTS Report CASCADE;
DROP TABLE IF EXISTS Comment CASCADE;
DROP TABLE IF EXISTS ExchangeRequest CASCADE;
DROP TABLE IF EXISTS ItemImage CASCADE;
DROP TABLE IF EXISTS Item CASCADE;
DROP TABLE IF EXISTS Category CASCADE;
DROP TABLE IF EXISTS Admin CASCADE;
DROP TABLE IF EXISTS Student CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

DROP TYPE IF EXISTS exchange_request_status CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;

-- =========================================================
-- 2. CREATE ENUM TYPES
-- =========================================================
CREATE TYPE item_status AS ENUM ('available', 'pending_offer', 'exchanging', 'exchanged');
CREATE TYPE report_status AS ENUM ('processing', 'finished');
CREATE TYPE exchange_request_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- =========================================================
-- 3. CREATE TABLES
-- =========================================================

CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url VARCHAR(255),
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contact_link VARCHAR(255) NOT NULL
);

CREATE TABLE Student (
    student_id INT PRIMARY KEY REFERENCES "User"(user_id) ON DELETE CASCADE,
    reputation INT DEFAULT 100
);

CREATE TABLE Admin (
    admin_id INT PRIMARY KEY REFERENCES "User"(user_id) ON DELETE CASCADE
);

CREATE TABLE Category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE Item (
    item_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    category_id INT REFERENCES Category(category_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    condition VARCHAR(255) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    status item_status DEFAULT 'available', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ItemImage (
    image_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL
);

-- UPDATE: Added confirmation columns
CREATE TABLE ExchangeRequest (
    request_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    sender_item_id INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    receiver_item_id INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    status exchange_request_status DEFAULT 'pending',
    
    -- New columns for double confirmation
    sender_confirmed BOOLEAN DEFAULT FALSE,
    receiver_confirmed BOOLEAN DEFAULT FALSE,
    
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Comment (
    comment_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    rating FLOAT NOT NULL CHECK (rating >= 0 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Report (
    report_id SERIAL PRIMARY KEY,
    reporter_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    target_user_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    target_item_id INT REFERENCES Item(item_id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'processing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notification (
    noti_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE History (
    history_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    action VARCHAR(255),
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AdminAction (
    action_id SERIAL PRIMARY KEY,
    admin_id INT NOT NULL REFERENCES Admin(admin_id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);