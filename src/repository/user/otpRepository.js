import PendingOtp from '../../model/PendingOtp.js';

export const findActive = (email, purpose) =>
    PendingOtp.findOne({ email: String(email).toLowerCase().trim(), purpose });

export const upsertOtp = (email, purpose, payload) =>
    PendingOtp.findOneAndUpdate(
        { email: String(email).toLowerCase().trim(), purpose },
        { $set: { ...payload, attempts: 0, isVerified: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

export const incrementAttempt = (id) =>
    PendingOtp.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });

export const markVerified = (id) =>
    PendingOtp.findByIdAndUpdate(id, { $set: { isVerified: true } }, { new: true });

export const remove = (id) =>
    PendingOtp.findByIdAndDelete(id);

export const removeForEmail = (email, purpose) =>
    PendingOtp.deleteMany({ email: String(email).toLowerCase().trim(), purpose });
