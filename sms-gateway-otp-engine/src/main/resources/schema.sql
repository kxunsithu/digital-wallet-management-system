-- PostgreSQL Database Schema for OTP Authentication Engine
-- Execute this script to create the required table

-- Create the phone_authentications table
CREATE TABLE phone_authentications (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_phone_number ON phone_authentications(phone_number);
CREATE INDEX idx_created_at ON phone_authentications(created_at DESC);
CREATE INDEX idx_phone_otp ON phone_authentications(phone_number, otp_code);

-- Comment on table
COMMENT ON TABLE phone_authentications IS 'Stores OTP authentication records for phone numbers';

-- Comment on columns
COMMENT ON COLUMN phone_authentications.id IS 'Unique identifier for each authentication record';
COMMENT ON COLUMN phone_authentications.phone_number IS 'Phone number in international or local format';
COMMENT ON COLUMN phone_authentications.otp_code IS 'One-Time Password (6-digit numeric code)';
COMMENT ON COLUMN phone_authentications.expiry_time IS 'Timestamp when the OTP expires';
COMMENT ON COLUMN phone_authentications.is_verified IS 'Flag indicating if the phone number has been verified';
COMMENT ON COLUMN phone_authentications.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN phone_authentications.updated_at IS 'Timestamp when the record was last updated';
