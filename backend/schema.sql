-- =========================================================
-- UniMarket schema.sql (store item images directly in DB)
-- PostgreSQL
-- =========================================================

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
    user_id      SERIAL PRIMARY KEY,
    full_name    VARCHAR(255),
    email        VARCHAR(255) NOT NULL UNIQUE,
    avatar_url   TEXT,
    join_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contact_link TEXT NOT NULL
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
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE Item (
    item_id      SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    category_id  INT REFERENCES Category(category_id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    condition    VARCHAR(255) NOT NULL,
    price        NUMERIC(12,2) NOT NULL,
    status       item_status DEFAULT 'available',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ItemImage: store image bytes directly in DB (BYTEA)
-- =========================================================
CREATE TABLE ItemImage (
    image_id     SERIAL PRIMARY KEY,
    item_id      INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,

    filename     TEXT,
    content_type TEXT NOT NULL,     -- e.g. image/jpeg, image/png
    data         BYTEA NOT NULL,    -- raw image bytes

    is_cover     BOOLEAN DEFAULT FALSE,
    sort_order   INT DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UPDATE: Added confirmation columns
CREATE TABLE ExchangeRequest (
    request_id        SERIAL PRIMARY KEY,
    sender_id         INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    receiver_id       INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    sender_item_id    INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    receiver_item_id  INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    status            exchange_request_status DEFAULT 'pending',

    -- double confirmation
    sender_confirmed  BOOLEAN DEFAULT FALSE,
    receiver_confirmed BOOLEAN DEFAULT FALSE,

    message           TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Comment (
    comment_id SERIAL PRIMARY KEY,
    item_id    INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    author_id  INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    rating     FLOAT NOT NULL CHECK (rating >= 0 AND rating <= 5),
    content    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Report (
    report_id      SERIAL PRIMARY KEY,
    reporter_id    INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    target_user_id INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    target_item_id INT REFERENCES Item(item_id) ON DELETE SET NULL,
    reason         TEXT NOT NULL,
    status         report_status DEFAULT 'processing',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notification (
    noti_id     SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE History (
    history_id SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES Student(student_id) ON DELETE CASCADE,
    item_id    INT NOT NULL REFERENCES Item(item_id) ON DELETE CASCADE,
    action     VARCHAR(255),
    time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE AdminAction (
    action_id    SERIAL PRIMARY KEY,
    admin_id     INT NOT NULL REFERENCES Admin(admin_id) ON DELETE CASCADE,
    target_type  VARCHAR(50) NOT NULL,
    target_id    INT NOT NULL,
    action       VARCHAR(255) NOT NULL,
    timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 4. INDEXES (recommended)
-- =========================================================
CREATE INDEX idx_item_user_id ON Item(user_id);
CREATE INDEX idx_item_category_id ON Item(category_id);
CREATE INDEX idx_item_status ON Item(status);

CREATE INDEX idx_itemimage_item_id ON ItemImage(item_id);
CREATE INDEX idx_exchangereq_sender_id ON ExchangeRequest(sender_id);
CREATE INDEX idx_exchangereq_receiver_id ON ExchangeRequest(receiver_id);
CREATE INDEX idx_exchangereq_status ON ExchangeRequest(status);

CREATE INDEX idx_comment_item_id ON Comment(item_id);
CREATE INDEX idx_report_status ON Report(status);
CREATE INDEX idx_notification_user_id ON Notification(user_id);

-- Optional: ensure at most one cover image per item
CREATE UNIQUE INDEX ux_itemimage_one_cover_per_item
ON ItemImage(item_id)
WHERE is_cover = TRUE;

-- =========================================================
-- 5. OPTIONAL: auto-update updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_updated_at ON Item;
CREATE TRIGGER trg_item_updated_at
BEFORE UPDATE ON Item
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_exchange_updated_at ON ExchangeRequest;
CREATE TRIGGER trg_exchange_updated_at
BEFORE UPDATE ON ExchangeRequest
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
